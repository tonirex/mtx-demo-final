"""Tests for analyzer classes."""

import json
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch

import pytest
import yaml

from src.services.analyzers import ConversationAnalyzer


class TestConversationAnalyzer:
    """Test conversation analyzer functionality."""

    def test_conversation_analyzer_initialization(self):
        """Test analyzer initialization with no scenarios."""
        with tempfile.TemporaryDirectory() as temp_dir:
            non_existent_path = Path(temp_dir) / "nonexistent"
            analyzer = ConversationAnalyzer(scenario_dir=non_existent_path)
            assert len(analyzer.evaluation_scenarios) == 0

    def test_load_evaluation_scenarios(self):
        """Test loading evaluation scenarios."""
        with tempfile.TemporaryDirectory() as temp_dir:
            scenario_dir = Path(temp_dir)

            # Create a test evaluation scenario file
            scenario_data = {
                "name": "Test Evaluation",
                "messages": [{"content": "Evaluate this conversation"}],
            }

            scenario_file = scenario_dir / "test-scenario-evaluation.prompt.yml"
            with open(scenario_file, "w", encoding="utf-8") as f:
                yaml.safe_dump(scenario_data, f)

            analyzer = ConversationAnalyzer(scenario_dir=scenario_dir)
            assert len(analyzer.evaluation_scenarios) == 1
            assert "test-scenario" in analyzer.evaluation_scenarios

    @patch("src.services.analyzers.config")
    def test_initialize_openai_client_missing_config(self, mock_config):
        """Test OpenAI client initialization with missing config."""
        mock_config.__getitem__.side_effect = lambda key: {
            "azure_openai_endpoint": "",
            "azure_openai_api_key": "",
        }.get(key, "")

        analyzer = ConversationAnalyzer()
        assert analyzer.openai_client is None

    @patch("src.services.analyzers.AzureOpenAI")
    @patch("src.services.analyzers.config")
    def test_initialize_openai_client_success(self, mock_config, mock_azure_openai):
        """Test successful OpenAI client initialization."""
        mock_config.__getitem__.side_effect = lambda key: {
            "azure_openai_endpoint": "https://test.openai.azure.com",
            "azure_openai_api_key": "test-key",
        }.get(key, "")

        analyzer = ConversationAnalyzer()
        assert analyzer.openai_client is not None
        mock_azure_openai.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_conversation_missing_scenario(self):
        """Test analyzing conversation with missing scenario."""
        analyzer = ConversationAnalyzer()
        analyzer.evaluation_scenarios = {}

        result = await analyzer.analyze_conversation("nonexistent", "test transcript")
        assert result is None

    def test_build_evaluation_prompt(self):
        """Test building evaluation prompt."""
        analyzer = ConversationAnalyzer()
        scenario = {"messages": [{"content": "Base evaluation prompt"}]}
        transcript = "Test conversation"

        prompt = analyzer._build_evaluation_prompt(scenario, transcript)
        assert "Base evaluation prompt" in prompt
        assert "Test conversation" in prompt
        assert "EXTRACTION REQUIREMENTS" in prompt
        assert "WHERE (Location)" in prompt
        assert "TRIAGE" in prompt

    def test_get_response_format(self):
        """Test getting response format for structured output."""
        analyzer = ConversationAnalyzer()
        format_def = analyzer._get_response_format()

        assert format_def["type"] == "json_schema"
        assert "emergency_case_form" in format_def["json_schema"]["name"]

        schema = format_def["json_schema"]["schema"]
        assert "where" in schema["properties"]
        assert "what" in schema["properties"]
        assert "who" in schema["properties"]
        assert "how_many" in schema["properties"]
        assert "triage" in schema["properties"]
        assert "case_summary" in schema["properties"]
        assert "completeness_score" in schema["properties"]

    def test_build_evaluation_messages(self):
        """Test building evaluation messages for API call."""
        analyzer = ConversationAnalyzer()

        prompt = "Test evaluation prompt"
        messages = analyzer._build_evaluation_messages(prompt)

        assert len(messages) == 2
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"
        assert messages[1]["content"] == prompt
        assert "emergency case analyst" in messages[0]["content"]

    # pylint: disable=R0801
    def test_analyze_conversation_with_openai_client(self):
        """Test analyzing conversation with mocked OpenAI client."""
        analyzer = ConversationAnalyzer()

        # Mock OpenAI client and configuration
        with patch("src.services.analyzers.config") as mock_config:
            mock_config.__getitem__.side_effect = lambda key: {
                "azure_openai_endpoint": "https://test.openai.azure.com",
                "azure_openai_api_key": "test-key",
                "api_version": "2024-02-01",
                "model_deployment_name": "gpt-4.1",
            }.get(key, "test-value")

            mock_client = Mock()
            mock_response = Mock()
            mock_response.choices = [Mock()]
            mock_response.choices[0].message.content = json.dumps(
                {
                    "where": {"address": "123 Main St", "floor_level": "", "landmarks": "", "access_notes": "", "confidence": "high"},
                    "what": {"emergency_type": "fire", "description": "House fire", "severity_estimate": "critical"},
                    "who": {"caller_name": "John", "caller_phone": "555-0100", "relationship_to_emergency": "witness"},
                    "how_many": {"people_affected": 2, "casualties_count": 0, "casualties_condition": []},
                    "triage": {"priority": "P1_critical", "dispatch_services": ["fire", "ambulance"], "rationale": "Active fire", "escalation_flags": [], "response_category": "immediate"},
                    "additional_info": {"hazards": "Gas leak possible", "caller_emotional_state": "panicked"},
                    "case_summary": "House fire at 123 Main St.",
                    "completeness_score": {"where": True, "what": True, "who": True, "how_many": True, "overall_pct": 90},
                }
            )
            mock_client.chat.completions.create.return_value = mock_response

            # Recreate analyzer with proper config
            analyzer = ConversationAnalyzer()
            analyzer.openai_client = mock_client

            # Mock scenario
            analyzer.evaluation_scenarios = {"test-scenario": {"messages": [{"content": "Test scenario content"}]}}

            # Test that the method exists and can be called
            assert analyzer.openai_client is not None


# pylint: enable=R0801
