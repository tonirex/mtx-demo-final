# ---------------------------------------------------------------------------------------------
#  Copyright (c) Microsoft Corporation. All rights reserved.
#  Licensed under the MIT License. See LICENSE in the project root for license information.
# --------------------------------------------------------------------------------------------

"""Cosmos DB persistence for emergency case forms."""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from azure.cosmos import CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosResourceNotFoundError

from src.config import config

logger = logging.getLogger(__name__)

CONTAINER_NAME = "cases"
PARTITION_KEY_PATH = "/scenario_id"


class CaseStore:
    """Stores and retrieves emergency case forms in Azure Cosmos DB."""

    def __init__(self):
        endpoint = config.get("cosmos_endpoint", "")
        api_key = config.get("azure_openai_api_key", "")

        if not endpoint:
            logger.warning("Cosmos DB endpoint not configured; persistence disabled")
            self.container = None
            return

        try:
            client = CosmosClient(endpoint, credential=api_key)
            database_name = config.get("cosmos_database", "emergency_cases")
            database = client.create_database_if_not_exists(id=database_name)
            self.container = database.create_container_if_not_exists(
                id=CONTAINER_NAME,
                partition_key=PartitionKey(path=PARTITION_KEY_PATH),
            )
            logger.info("CaseStore connected to Cosmos DB: %s/%s", database_name, CONTAINER_NAME)
        except Exception as e:
            logger.error("Failed to initialise Cosmos DB: %s", e)
            self.container = None

    def save_case(self, scenario_id: str, case_form: Dict[str, Any], transcript: str) -> Optional[str]:
        """Persist a case form and return the generated case ID."""
        if self.container is None:
            logger.warning("Cosmos DB not available; case not saved")
            return None

        case_id = str(uuid.uuid4())
        document = {
            "id": case_id,
            "scenario_id": scenario_id,
            "case_form": case_form,
            "transcript": transcript,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        try:
            self.container.create_item(body=document)
            logger.info("Case saved: %s", case_id)
            return case_id
        except Exception as e:
            logger.error("Failed to save case %s: %s", case_id, e)
            return None

    def get_case(self, case_id: str, scenario_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single case by ID."""
        if self.container is None:
            return None

        try:
            return self.container.read_item(item=case_id, partition_key=scenario_id)
        except CosmosResourceNotFoundError:
            return None
        except Exception as e:
            logger.error("Failed to read case %s: %s", case_id, e)
            return None

    def list_cases(self, limit: int = 50) -> List[Dict[str, Any]]:
        """List recent cases across all scenarios."""
        if self.container is None:
            return []

        try:
            query = "SELECT * FROM c ORDER BY c.created_at DESC OFFSET 0 LIMIT @limit"
            items = list(
                self.container.query_items(
                    query=query,
                    parameters=[{"name": "@limit", "value": limit}],
                    enable_cross_partition_query=True,
                )
            )
            return items
        except Exception as e:
            logger.error("Failed to list cases: %s", e)
            return []
