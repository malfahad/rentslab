"""Helpers for DRF API tests."""

from __future__ import annotations

from typing import Any

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


class APICRUDMixin:
    """Mixin with assertions for JSON API CRUD (expects ModelViewSet + JSON)."""

    client: APIClient

    def assert_list_ok(self, url: str) -> list:
        r = self.client.get(url)
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.content)
        data = r.json()
        if isinstance(data, dict) and 'results' in data:
            self.assertIn('count', data)
            return data['results']
        self.assertIsInstance(data, list)
        return data

    def assert_create(self, url: str, payload: dict[str, Any], expected_status=status.HTTP_201_CREATED):
        r = self.client.post(url, payload, format='json')
        self.assertEqual(r.status_code, expected_status, r.content)
        return r.json() if r.status_code == expected_status else None

    def assert_retrieve_ok(self, url: str) -> dict:
        r = self.client.get(url)
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.content)
        return r.json()

    def assert_patch_ok(self, url: str, payload: dict[str, Any]) -> dict:
        r = self.client.patch(url, payload, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.content)
        return r.json()

    def assert_delete_ok(self, url: str):
        r = self.client.delete(url)
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT, r.content)


class DRFTestCase(TestCase, APICRUDMixin):
    """Base with APIClient."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
