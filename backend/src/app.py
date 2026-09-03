# ---------------------------------------------------------------------------------------------
#  Copyright (c) Microsoft Corporation. All rights reserved.
#  Licensed under the MIT License. See LICENSE in the project root for license information.
# --------------------------------------------------------------------------------------------

"""Flask application for the Emergency Response Case Creation system."""

import asyncio
import logging
import os
from typing import Any, Dict, cast

import simple_websocket.ws  # pyright: ignore[reportMissingTypeStubs]
from flask import Flask, jsonify, request, send_from_directory
from flask_sock import Sock  # pyright: ignore[reportMissingTypeStubs]

from src.config import config
from src.services.analyzers import ConversationAnalyzer
from src.services.case_store import CaseStore
from src.services.managers import DEMO_SCENARIOS, AgentManager, ScenarioManager
from src.services.websocket_handler import VoiceProxyHandler

# Constants
STATIC_FOLDER = "../static"
STATIC_URL_PATH = ""
INDEX_FILE = "index.html"
AUDIO_PROCESSOR_FILE = "audio-processor.js"
WEBSOCKET_ENDPOINT = "/ws/voice"

# API endpoints
API_CONFIG_ENDPOINT = "/api/config"
API_SCENARIOS_ENDPOINT = "/api/scenarios"
API_AGENTS_CREATE_ENDPOINT = "/api/agents/create"
API_ANALYZE_ENDPOINT = "/api/analyze"
API_CASES_ENDPOINT = "/api/cases"

# Error messages
SCENARIO_ID_REQUIRED = "scenario_id is required"
SCENARIO_NOT_FOUND = "Scenario not found"
TRANSCRIPT_REQUIRED = "scenario_id and transcript are required"

# HTTP status codes
HTTP_BAD_REQUEST = 400
HTTP_NOT_FOUND = 404
HTTP_INTERNAL_SERVER_ERROR = 500

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask application
app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path=STATIC_URL_PATH)
sock = Sock(app)

# Initialize managers and analyzers
scenario_manager = ScenarioManager()
agent_manager = AgentManager()
conversation_analyzer = ConversationAnalyzer()
case_store = CaseStore()
voice_proxy_handler = VoiceProxyHandler(agent_manager)


@app.route("/")
def index():
    """Serve the main application page."""
    if app.static_folder is None:
        logger.error("STATIC_FOLDER is not set. Cannot serve index.html.")
        import sys  # pylint: disable=C0415

        sys.exit(1)
    return send_from_directory(app.static_folder, INDEX_FILE)


@app.route("/video-assets/<scenario_id>/<path:filename>")
def video_asset(scenario_id: str, filename: str):
    """Serve video scenario assets (mp4 / jpg) from data/video-scenarios/.

    Mirrors the Vite dev middleware in frontend/vite.config.ts so the same
    URL works in dev and prod. See docs/VIDEO_ANALYTICS_DEMO_REQUIREMENTS.md.
    """
    # Resolve the on-disk root: prefer Docker /app path, fall back to repo path.
    docker_root = os.path.join("/app", "data", "video-scenarios")
    repo_root = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "video-scenarios")
    )
    root = docker_root if os.path.isdir(docker_root) else repo_root

    scenario_dir = os.path.join(root, scenario_id)
    if not os.path.isdir(scenario_dir):
        return jsonify({"error": "scenario not found"}), HTTP_NOT_FOUND
    # send_from_directory enforces path-traversal safety.
    return send_from_directory(scenario_dir, filename, conditional=True)



@app.route(API_CONFIG_ENDPOINT)
def get_config():
    """Get client configuration."""
    return jsonify({"proxy_enabled": True, "ws_endpoint": WEBSOCKET_ENDPOINT})


@app.route(API_SCENARIOS_ENDPOINT)
def get_scenarios():
    """Get list of available scenarios."""
    return jsonify(scenario_manager.list_scenarios())


@app.route(f"{API_SCENARIOS_ENDPOINT}/<scenario_id>")
def get_scenario(scenario_id: str):
    """Get a specific scenario by ID."""
    scenario = scenario_manager.get_scenario(scenario_id)
    if scenario:
        return jsonify(scenario)
    return jsonify({"error": SCENARIO_NOT_FOUND}), HTTP_NOT_FOUND


@app.route(API_AGENTS_CREATE_ENDPOINT, methods=["POST"])
def create_agent():
    """Create a new agent for a scenario."""
    data = cast(Dict[str, Any], request.json)
    scenario_id = data.get("scenario_id")

    if not scenario_id:
        return jsonify({"error": SCENARIO_ID_REQUIRED}), HTTP_BAD_REQUEST

    scenario = scenario_manager.get_scenario(scenario_id)
    if not scenario:
        logger.error(
            "Scenario not found: %s. Available scenarios: %s + generated: %s",
            scenario_id,
            list(scenario_manager.scenarios.keys()),
            list(scenario_manager.generated_scenarios.keys()),
        )
        return jsonify({"error": SCENARIO_NOT_FOUND}), HTTP_NOT_FOUND

    try:
        agent_id = agent_manager.create_agent(scenario_id, scenario)
        return jsonify({"agent_id": agent_id, "scenario_id": scenario_id})
    except Exception as e:
        logger.error("Failed to create agent: %s", e)
        return jsonify({"error": str(e)}), HTTP_INTERNAL_SERVER_ERROR


@app.route("/api/agents/<agent_id>", methods=["DELETE"])
def delete_agent(agent_id: str):
    """Delete an agent."""
    try:
        agent_manager.delete_agent(agent_id)
        return jsonify({"success": True})
    except Exception as e:
        logger.error("Failed to delete agent: %s", e)
        return jsonify({"error": str(e)}), HTTP_INTERNAL_SERVER_ERROR


@app.route(API_ANALYZE_ENDPOINT, methods=["POST"])
def analyze_conversation():
    """Analyze an emergency call transcript and extract a case form."""
    data = cast(Dict[str, Any], request.json)
    scenario_id = cast(str, data.get("scenario_id"))
    transcript = cast(str, data.get("transcript"))

    logger.info(
        "Analyze request - scenario: %s, transcript length: %s",
        scenario_id,
        len(transcript or ""),
    )

    if not scenario_id or not transcript:
        return jsonify({"error": TRANSCRIPT_REQUIRED}), HTTP_BAD_REQUEST

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        # Map demo scenario IDs to the underlying evaluation scenario
        eval_scenario_id = scenario_id
        demo = DEMO_SCENARIOS.get(scenario_id)
        if demo:
            eval_scenario_id = demo.get("evaluation_scenario_id", scenario_id)

        case_form = loop.run_until_complete(
            conversation_analyzer.analyze_conversation(eval_scenario_id, transcript)
        )

        if isinstance(case_form, Exception):
            logger.error("Case extraction failed: %s", case_form)
            case_form = None

        case_id = None
        if case_form:
            case_id = case_store.save_case(scenario_id, case_form, transcript)

        return jsonify({"case_form": case_form, "case_id": case_id})
    finally:
        loop.close()


@app.route(f"/{AUDIO_PROCESSOR_FILE}")
def audio_processor():
    """Serve the audio processor JavaScript file."""
    return send_from_directory("static", AUDIO_PROCESSOR_FILE)


@sock.route(WEBSOCKET_ENDPOINT)  # pyright: ignore[reportUnknownMemberType]
def voice_proxy(ws: simple_websocket.ws.Server):
    """WebSocket endpoint for voice proxy."""

    logger.info("New WebSocket connection")

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    loop.run_until_complete(voice_proxy_handler.handle_connection(ws))


@app.route(API_CASES_ENDPOINT)
def list_cases():
    """List recent emergency cases."""
    return jsonify(case_store.list_cases())


@app.route(f"{API_CASES_ENDPOINT}/<case_id>")
def get_case(case_id: str):
    """Get a specific case by ID."""
    scenario_id = request.args.get("scenario_id", "")
    case = case_store.get_case(case_id, scenario_id)
    if case:
        return jsonify(case)
    return jsonify({"error": "Case not found"}), HTTP_NOT_FOUND


def main():
    """Run the Flask application."""
    host = config["host"]
    port = config["port"]
    print(f"Starting Voice Live Demo on http://{host}:{port}")

    debug_mode = os.getenv("FLASK_ENV") == "development"
    app.run(host=host, port=port, debug=debug_mode)


if __name__ == "__main__":
    main()
