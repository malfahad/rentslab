"""Shared pytest fixtures (requires pytest-django; see requirements-dev.txt)."""

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()
