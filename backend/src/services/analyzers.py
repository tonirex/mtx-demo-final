# ---------------------------------------------------------------------------------------------
#  Copyright (c) Microsoft Corporation. All rights reserved.
#  Licensed under the MIT License. See LICENSE in the project root for license information.
# --------------------------------------------------------------------------------------------

"""Analysis components for emergency call transcript extraction and triage."""

import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from openai import AzureOpenAI

from src.config import config
from src.services.scenario_utils import determine_scenario_directory

logger = logging.getLogger(__name__)

# Constants
EVALUATION_FILE_SUFFIX = "*evaluation.prompt.yml"
EVALUATION_SUFFIX_REMOVAL = "-evaluation.prompt"


class ConversationAnalyzer:
    """Extracts structured 5W case forms and triage from emergency call transcripts using Azure OpenAI."""

    def __init__(self, scenario_dir: Optional[Path] = None):
        self.scenario_dir = determine_scenario_directory(scenario_dir)
        self.evaluation_scenarios = self._load_evaluation_scenarios()
        self.openai_client = self._initialize_openai_client()

    def _load_evaluation_scenarios(self) -> Dict[str, Any]:
        scenarios: Dict[str, Any] = {}
        if not self.scenario_dir.exists():
            logger.warning("Scenarios directory not found: %s", self.scenario_dir)
            return scenarios

        for file in self.scenario_dir.glob(EVALUATION_FILE_SUFFIX):
            try:
                with open(file, encoding="utf-8") as f:
                    scenario = yaml.safe_load(f)
                    scenario_id = file.stem.replace(EVALUATION_SUFFIX_REMOVAL, "")
                    scenarios[scenario_id] = scenario
                    logger.info("Loaded evaluation scenario: %s", scenario_id)
            except Exception as e:
                logger.error("Error loading evaluation scenario %s: %s", file, e)

        logger.info("Total evaluation scenarios loaded: %s", len(scenarios))
        return scenarios

    def _initialize_openai_client(self) -> Optional[AzureOpenAI]:
        try:
            endpoint = config["azure_openai_endpoint"]
            api_key = config["azure_openai_api_key"]
            if not endpoint or not api_key:
                logger.error("Azure OpenAI endpoint or API key not configured")
                return None
            # Normalize endpoint: AzureOpenAI SDK appends /openai/ itself, so strip
            # any trailing /openai/v1 or /openai suffix (Azure AI Foundry format).
            normalized = endpoint.rstrip("/")
            for suffix in ("/openai/v1", "/openai"):
                if normalized.endswith(suffix):
                    normalized = normalized[: -len(suffix)]
                    break
            client = AzureOpenAI(
                api_version=config["api_version"],
                azure_endpoint=normalized,
                api_key=api_key,
            )
            logger.info("ConversationAnalyzer initialized with endpoint: %s (normalized from %s)", normalized, endpoint)
            return client
        except Exception as e:
            logger.error("Failed to initialize OpenAI client: %s", e)
            return None

    async def analyze_conversation(self, scenario_id: str, transcript: str) -> Optional[Dict[str, Any]]:
        """Analyze an emergency call transcript and extract 5W case form + triage."""
        logger.info("Starting case extraction for scenario: %s", scenario_id)

        evaluation_scenario = self.evaluation_scenarios.get(scenario_id)
        if not evaluation_scenario:
            logger.error("Evaluation scenario not found: %s", scenario_id)
            return None

        if not self.openai_client:
            logger.error("OpenAI client not configured")
            return None

        return await self._call_evaluation_model(evaluation_scenario, transcript)

    def _build_evaluation_prompt(self, scenario: Dict[str, Any], transcript: str) -> str:
        base_prompt = scenario["messages"][0]["content"]
        return f"""{base_prompt}

        EXTRACTION REQUIREMENTS:

        From the emergency call transcript below, extract:

        **WHERE (Location):**
        - address: Full street address if provided
        - floor_level: Floor, room, or unit number
        - landmarks: Any nearby landmarks mentioned
        - access_notes: Any notes about access (e.g., gate code, blocked entrance)
        - confidence: "high" if full address given, "medium" if partial, "low" if vague

        **WHAT (Situation):**
        - emergency_type: One of "fire", "medical", "accident", "crime", "other"
        - description: Brief description of what happened
        - severity_estimate: One of "critical", "serious", "moderate", "minor"

        **WHO (Caller):**
        - caller_name: Name if provided
        - caller_phone: Phone number if provided
        - relationship_to_emergency: e.g., "witness", "victim", "bystander", "relative"

        **HOW MANY (Casualties):**
        - people_affected: Total number of people affected/involved
        - casualties_count: Number of injured/ill persons
        - casualties_condition: Array of condition descriptions

        **TRIAGE:**
        - priority: "P1_critical", "P2_urgent", or "P3_standard"
        - dispatch_services: Array from ["police", "fire", "ambulance", "hazmat"]
        - rationale: Brief explanation for the priority assignment
        - escalation_flags: Array of critical flags requiring supervisor attention
        - response_category: "immediate", "rapid", or "scheduled"

        **ADDITIONAL INFO:**
        - hazards: Any hazards mentioned (e.g., gas leak, weapons, chemicals)
        - caller_emotional_state: Brief description (e.g., "panicked", "calm", "distressed")

        **COMPLETENESS:**
        - where: true if caller provided a usable location
        - what: true if the type of emergency was established
        - who: true if caller identified themselves
        - how_many: true if number of affected persons was established
        - overall_pct: percentage (0-100) of key information captured

        **case_summary:** A concise paragraph suitable for a dispatch log.

        EMERGENCY CALL TRANSCRIPT TO ANALYZE:
        {transcript}
        """

    async def _call_evaluation_model(self, scenario: Dict[str, Any], transcript: str) -> Optional[Dict[str, Any]]:
        if not self.openai_client:
            return None
        openai_client = self.openai_client

        try:
            evaluation_prompt = self._build_evaluation_prompt(scenario, transcript)
            completion = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: openai_client.chat.completions.create(
                    model=config["model_deployment_name"],
                    messages=self._build_evaluation_messages(evaluation_prompt),  # pyright: ignore[reportArgumentType]
                    response_format=self._get_response_format(),  # pyright: ignore[reportArgumentType]
                ),
            )

            if completion.choices[0].message.content:
                return json.loads(completion.choices[0].message.content)

            logger.error("No content received from OpenAI")
            return None
        except Exception as e:
            logger.error("Error in evaluation model: %s", e, exc_info=True)
            return None

    def _build_evaluation_messages(self, evaluation_prompt: str) -> List[Dict[str, str]]:
        return [
            {
                "role": "system",
                "content": "You are an expert emergency case analyst. "
                "Analyse the provided emergency call transcript and return a structured case form "
                "with 5W extraction and triage classification.",
            },
            {"role": "user", "content": evaluation_prompt},
        ]

    def _get_response_format(self) -> Dict[str, Any]:
        return {
            "type": "json_schema",
            "json_schema": {
                "name": "emergency_case_form",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "where": {
                            "type": "object",
                            "properties": {
                                "address": {"type": "string"},
                                "floor_level": {"type": "string"},
                                "landmarks": {"type": "string"},
                                "access_notes": {"type": "string"},
                                "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                            },
                            "required": ["address", "floor_level", "landmarks", "access_notes", "confidence"],
                            "additionalProperties": False,
                        },
                        "what": {
                            "type": "object",
                            "properties": {
                                "emergency_type": {
                                    "type": "string",
                                    "enum": ["fire", "medical", "accident", "crime", "other"],
                                },
                                "description": {"type": "string"},
                                "severity_estimate": {
                                    "type": "string",
                                    "enum": ["critical", "serious", "moderate", "minor"],
                                },
                            },
                            "required": ["emergency_type", "description", "severity_estimate"],
                            "additionalProperties": False,
                        },
                        "who": {
                            "type": "object",
                            "properties": {
                                "caller_name": {"type": "string"},
                                "caller_phone": {"type": "string"},
                                "relationship_to_emergency": {"type": "string"},
                            },
                            "required": ["caller_name", "caller_phone", "relationship_to_emergency"],
                            "additionalProperties": False,
                        },
                        "how_many": {
                            "type": "object",
                            "properties": {
                                "people_affected": {"type": "integer"},
                                "casualties_count": {"type": "integer"},
                                "casualties_condition": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                            },
                            "required": ["people_affected", "casualties_count", "casualties_condition"],
                            "additionalProperties": False,
                        },
                        "triage": {
                            "type": "object",
                            "properties": {
                                "priority": {
                                    "type": "string",
                                    "enum": ["P1_critical", "P2_urgent", "P3_standard"],
                                },
                                "dispatch_services": {
                                    "type": "array",
                                    "items": {
                                        "type": "string",
                                        "enum": ["police", "fire", "ambulance", "hazmat"],
                                    },
                                },
                                "rationale": {"type": "string"},
                                "escalation_flags": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                                "response_category": {
                                    "type": "string",
                                    "enum": ["immediate", "rapid", "scheduled"],
                                },
                            },
                            "required": [
                                "priority",
                                "dispatch_services",
                                "rationale",
                                "escalation_flags",
                                "response_category",
                            ],
                            "additionalProperties": False,
                        },
                        "additional_info": {
                            "type": "object",
                            "properties": {
                                "hazards": {"type": "string"},
                                "caller_emotional_state": {"type": "string"},
                            },
                            "required": ["hazards", "caller_emotional_state"],
                            "additionalProperties": False,
                        },
                        "case_summary": {"type": "string"},
                        "completeness_score": {
                            "type": "object",
                            "properties": {
                                "where": {"type": "boolean"},
                                "what": {"type": "boolean"},
                                "who": {"type": "boolean"},
                                "how_many": {"type": "boolean"},
                                "overall_pct": {"type": "integer"},
                            },
                            "required": ["where", "what", "who", "how_many", "overall_pct"],
                            "additionalProperties": False,
                        },
                    },
                    "required": [
                        "where",
                        "what",
                        "who",
                        "how_many",
                        "triage",
                        "additional_info",
                        "case_summary",
                        "completeness_score",
                    ],
                    "additionalProperties": False,
                },
            },
        }
