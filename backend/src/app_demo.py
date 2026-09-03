# ---------------------------------------------------------------------------------------------
#  Copyright (c) Microsoft Corporation. All rights reserved.
#  Licensed under the MIT License. See LICENSE in the project root for license information.
# --------------------------------------------------------------------------------------------

"""Slim demo-only Flask application.

Serves only what the mocked demo experience needs:

* ``/``                                — the bundled SPA (index.html).
* ``/<static>``                        — Vite build output (js/css/assets).
* ``/video-assets/<scenario>/<file>``  — read-only mp4 / jpg fixtures.
* ``/api/scenarios``                   — returns ``[]``; the frontend's
  ``useScenarios`` hook falls back to bundled ``DEMO_SCENARIOS`` +
  ``VIDEO_SCENARIOS`` fixtures when the API list is empty / unavailable.
* ``/api/config``                      — minimal config payload that signals
  demo mode (``proxy_enabled: false``).

This image deliberately does NOT load:

* ``src.services.analyzers``        (LLM analyzer)
* ``src.services.managers``         (Azure AI agent manager)
* ``src.services.websocket_handler`` (VoiceLive proxy)
* ``src.services.case_store``       (Cosmos DB persistence)
* ``src.config``                    (lives behind dotenv / Azure env vars)

so the slim image carries no ``azure-*`` / ``openai`` / ``flask-sock``
dependencies and exposes no live-mode endpoints (``/api/analyze``,
``/api/agents/*``, ``/ws/voice``).

See ``docs/DEMO_DEPLOYMENT_NOTES.md`` and ``docs/DEMO_ARCHITECTURE.md``.
"""

import logging
import os

from flask import Flask, jsonify, send_from_directory

STATIC_FOLDER = "../static"
STATIC_URL_PATH = ""
INDEX_FILE = "index.html"

DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8000

HTTP_NOT_FOUND = 404

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path=STATIC_URL_PATH)


def _video_scenarios_root() -> str:
    """Resolve the on-disk root of ``data/video-scenarios``.

    Prefers the Docker layout (``/app/data/video-scenarios``) and falls
    back to the repo path so the same module also runs ``python -m
    src.app_demo`` from a developer checkout.
    """
    docker_root = os.path.join("/app", "data", "video-scenarios")
    if os.path.isdir(docker_root):
        return docker_root
    return os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "..", "data", "video-scenarios")
    )


@app.route("/")
def index():
    """Serve the SPA entry point."""
    if app.static_folder is None:
        logger.error("STATIC_FOLDER is not set. Cannot serve index.html.")
        return jsonify({"error": "static folder not configured"}), 500
    return send_from_directory(app.static_folder, INDEX_FILE)


@app.route("/api/config")
def get_config():
    """Return a minimal config payload that signals demo mode."""
    return jsonify({"proxy_enabled": False, "ws_endpoint": None, "demo_only": True})


@app.route("/api/scenarios")
def get_scenarios():
    """Return an empty list.

    The frontend ships ``DEMO_SCENARIOS`` and ``VIDEO_SCENARIOS`` as
    bundled fixtures and merges them with this response, so an empty
    list is sufficient and intentional in the demo image.
    """
    return jsonify([])


@app.route("/video-assets/<scenario_id>/<path:filename>")
def video_asset(scenario_id: str, filename: str):
    """Serve mp4 / jpg fixtures for a video-demo scenario."""
    scenario_dir = os.path.join(_video_scenarios_root(), scenario_id)
    if not os.path.isdir(scenario_dir):
        return jsonify({"error": "scenario not found"}), HTTP_NOT_FOUND
    # send_from_directory enforces path-traversal safety.
    return send_from_directory(scenario_dir, filename, conditional=True)


def main() -> None:
    """Run the slim demo Flask application."""
    host = os.getenv("HOST", DEFAULT_HOST)
    port = int(os.getenv("PORT", str(DEFAULT_PORT)))
    debug_mode = os.getenv("FLASK_ENV") == "development"
    logger.info("Starting demo-only server on http://%s:%s", host, port)
    app.run(host=host, port=port, debug=debug_mode)


if __name__ == "__main__":
    main()
