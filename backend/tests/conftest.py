"""Shared pytest configuration for backend tests."""
import pytest

# Ensure pytest-asyncio uses a single session-scoped event loop so that
# motor's AsyncIOMotorClient (which caches a loop reference) remains valid
# across multiple async tests in the same module.
pytest_plugins = ["pytest_asyncio"]


def pytest_collection_modifyitems(config, items):
    # Set the asyncio mode default for any async tests that didn't mark it.
    for item in items:
        if "asyncio" in item.keywords:
            item.add_marker(pytest.mark.asyncio(loop_scope="session"))
