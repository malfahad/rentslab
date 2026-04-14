"""Assertions for API responses (status + message bodies)."""

from __future__ import annotations

from typing import Any

from django.test import TestCase


def flatten_error_body(data: Any) -> str:
    """Turn DRF error JSON into one searchable string."""
    if data is None:
        return ''
    if isinstance(data, str):
        return data
    if isinstance(data, list):
        return ' '.join(flatten_error_body(x) for x in data)
    if isinstance(data, dict):
        parts = []
        for v in data.values():
            parts.append(flatten_error_body(v))
        return ' '.join(parts)
    return str(data)


def assert_error_response(
    testcase: TestCase,
    response,
    expected_status: int,
    *,
    detail_substring: str | None = None,
    field_messages: dict[str, str] | None = None,
) -> dict:
    """
    Assert HTTP status and that error text matches.

    * detail_substring: must appear somewhere in the flattened error payload (detail + field errors).
    * field_messages: map field name -> substring that must appear in that field's errors.
    """
    testcase.assertEqual(
        response.status_code,
        expected_status,
        f'Expected status {expected_status}, got {response.status_code}. Body: {getattr(response, "content", b"")!r}',
    )
    try:
        data = response.json()
    except Exception:
        testcase.fail(f'Response is not JSON: {response.content!r}')
    if detail_substring is not None:
        flat = flatten_error_body(data)
        testcase.assertIn(
            detail_substring,
            flat,
            msg=f'Expected substring {detail_substring!r} in errors. Got JSON: {data!r}',
        )
    if field_messages:
        for field, substring in field_messages.items():
            testcase.assertIn(field, data, msg=f'Missing field {field!r} in {data!r}')
            field_val = data[field]
            if isinstance(field_val, list):
                combined = ' '.join(str(x) for x in field_val)
            else:
                combined = str(field_val)
            testcase.assertIn(
                substring,
                combined,
                msg=f'Field {field!r}: expected {substring!r} in {field_val!r}',
            )
    return data


def assert_success_detail(testcase: TestCase, response, expected_status: int, detail_substring: str) -> dict:
    testcase.assertEqual(response.status_code, expected_status)
    data = response.json()
    detail = data.get('detail', '')
    if isinstance(detail, list):
        detail = ' '.join(str(x) for x in detail)
    testcase.assertIn(detail_substring, str(detail), msg=f'Full body: {data!r}')
    return data
