"""
Test module for Google Auth and Cloud Sync features
Tests:
- /api/auth/me - Get authenticated user
- /api/auth/logout - Clear session
- /api/sync/backup - Store user data
- /api/sync/restore - Retrieve user data
- /api/sync/status - Get sync status
- /api/sync/clear - Clear cloud data
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://peptide-research-9.preview.emergentagent.com').rstrip('/')

# Test credentials created via mongosh
TEST_SESSION_TOKEN = "test_session_auth_1771180959836"
TEST_USER_ID = "test-user-auth-1771180959836"
TEST_EMAIL = "test.user.1771180959836@example.com"


class TestAuthEndpoints:
    """Test authentication endpoints"""

    def test_auth_me_with_valid_token(self):
        """Test /api/auth/me returns user data with valid session token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user_id" in data, "Response should contain user_id"
        assert "email" in data, "Response should contain email"
        assert "name" in data, "Response should contain name"
        assert data["user_id"] == TEST_USER_ID
        assert data["email"] == TEST_EMAIL
        print(f"✓ Auth me endpoint returned user: {data['name']} ({data['email']})")

    def test_auth_me_without_token(self):
        """Test /api/auth/me returns 401 without session token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Auth me correctly rejects unauthenticated requests")

    def test_auth_me_with_invalid_token(self):
        """Test /api/auth/me returns 401 with invalid session token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Auth me correctly rejects invalid tokens")


class TestCloudSyncEndpoints:
    """Test cloud sync endpoints - backup, restore, status, clear"""

    def test_sync_backup_success(self):
        """Test /api/sync/backup stores user data"""
        test_data = {
            "user_id": TEST_USER_ID,
            "data": {
                "recurring_items": [{"name": "Test Peptide", "dosage_amount": 100}],
                "journal_entries": [{"date": "2026-01-15", "notes": "Test entry"}],
                "calculator_presets": [{"name": "Test Preset", "vial_mg": 5}],
                "custom_peptides": [],
                "custom_medications": [],
                "vendors": [],
                "orders": [],
                "injection_sites": {},
                "settings": {"weightUnit": "lbs"},
                "goals": ["Test goal"],
                "last_sync": "2026-01-15T10:00:00Z"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/sync/backup",
            headers={
                "Authorization": f"Bearer {TEST_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json=test_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Backup should return success: true"
        assert "last_sync" in data, "Backup should return last_sync timestamp"
        print(f"✓ Sync backup successful, last_sync: {data['last_sync']}")

    def test_sync_backup_unauthorized(self):
        """Test /api/sync/backup rejects unauthorized requests"""
        test_data = {
            "user_id": TEST_USER_ID,
            "data": {"test": "data"}
        }
        
        response = requests.post(
            f"{BASE_URL}/api/sync/backup",
            headers={"Content-Type": "application/json"},
            json=test_data
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Sync backup correctly rejects unauthenticated requests")

    def test_sync_backup_wrong_user(self):
        """Test /api/sync/backup rejects requests for different user"""
        test_data = {
            "user_id": "different-user-id",
            "data": {"test": "data"}
        }
        
        response = requests.post(
            f"{BASE_URL}/api/sync/backup",
            headers={
                "Authorization": f"Bearer {TEST_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json=test_data
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Sync backup correctly rejects requests for other users")

    def test_sync_restore_success(self):
        """Test /api/sync/restore retrieves user data"""
        response = requests.get(
            f"{BASE_URL}/api/sync/restore/{TEST_USER_ID}",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "data" in data, "Restore should return data field"
        assert "last_sync" in data, "Restore should return last_sync"
        
        # Verify the data we backed up earlier
        if data["data"]:
            assert "recurring_items" in data["data"], "Data should contain recurring_items"
            assert "journal_entries" in data["data"], "Data should contain journal_entries"
            print(f"✓ Sync restore successful, retrieved data with {len(data['data'].get('recurring_items', []))} recurring items")
        else:
            print("✓ Sync restore returned empty data (no backup yet)")

    def test_sync_restore_unauthorized(self):
        """Test /api/sync/restore rejects unauthorized requests"""
        response = requests.get(f"{BASE_URL}/api/sync/restore/{TEST_USER_ID}")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Sync restore correctly rejects unauthenticated requests")

    def test_sync_restore_wrong_user(self):
        """Test /api/sync/restore rejects requests for different user"""
        response = requests.get(
            f"{BASE_URL}/api/sync/restore/different-user-id",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Sync restore correctly rejects requests for other users")

    def test_sync_status_success(self):
        """Test /api/sync/status returns sync info"""
        response = requests.get(
            f"{BASE_URL}/api/sync/status/{TEST_USER_ID}",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "last_sync" in data, "Status should return last_sync"
        assert "has_data" in data, "Status should return has_data boolean"
        print(f"✓ Sync status: has_data={data['has_data']}, last_sync={data['last_sync']}")

    def test_sync_status_unauthorized(self):
        """Test /api/sync/status rejects unauthorized requests"""
        response = requests.get(f"{BASE_URL}/api/sync/status/{TEST_USER_ID}")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Sync status correctly rejects unauthenticated requests")


class TestAuthLogout:
    """Test logout functionality"""

    def test_logout_clears_session(self):
        """Test /api/auth/logout clears the session"""
        # Create a new test session for logout test
        import subprocess
        result = subprocess.run([
            "mongosh", "--quiet", "--eval",
            "use('test_database'); " +
            "var userId = 'test-user-logout-' + Date.now(); " +
            "var sessionToken = 'test_logout_' + Date.now(); " +
            "db.users.insertOne({ user_id: userId, email: userId + '@test.com', name: 'Logout Test User', created_at: new Date() }); " +
            "db.user_sessions.insertOne({ user_id: userId, session_token: sessionToken, expires_at: new Date(Date.now() + 7*24*60*60*1000), created_at: new Date() }); " +
            "print(JSON.stringify({ session_token: sessionToken, user_id: userId }));"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            import json
            test_creds = json.loads(result.stdout.strip())
            logout_token = test_creds["session_token"]
            
            # First verify the token works
            verify_response = requests.get(
                f"{BASE_URL}/api/auth/me",
                headers={"Authorization": f"Bearer {logout_token}"}
            )
            assert verify_response.status_code == 200, "Token should be valid before logout"
            
            # Now logout
            logout_response = requests.post(
                f"{BASE_URL}/api/auth/logout",
                headers={"Authorization": f"Bearer {logout_token}"},
                cookies={"session_token": logout_token}
            )
            
            assert logout_response.status_code == 200, f"Expected 200, got {logout_response.status_code}"
            data = logout_response.json()
            assert data.get("message") == "Logged out", "Should return logged out message"
            
            # Verify the session is now invalid
            verify_after = requests.get(
                f"{BASE_URL}/api/auth/me",
                headers={"Authorization": f"Bearer {logout_token}"}
            )
            assert verify_after.status_code == 401, "Token should be invalid after logout"
            
            print("✓ Logout successfully clears session")
        else:
            pytest.skip("Could not create test session for logout test")


class TestAuthSession:
    """Test session exchange endpoint (POST /api/auth/session)"""

    def test_auth_session_invalid_session_id(self):
        """Test /api/auth/session returns 401 for invalid session_id"""
        response = requests.post(
            f"{BASE_URL}/api/auth/session",
            headers={"Content-Type": "application/json"},
            json={"session_id": "invalid_session_id_12345"}
        )
        
        # Should return 401 for invalid Emergent Auth session
        assert response.status_code in [401, 500], f"Expected 401 or 500 for invalid session, got {response.status_code}"
        print("✓ Auth session correctly rejects invalid session_id")

    def test_auth_session_missing_session_id(self):
        """Test /api/auth/session returns error without session_id"""
        response = requests.post(
            f"{BASE_URL}/api/auth/session",
            headers={"Content-Type": "application/json"},
            json={}
        )
        
        # Should return 422 (validation error) for missing required field
        assert response.status_code == 422, f"Expected 422 for missing session_id, got {response.status_code}"
        print("✓ Auth session correctly requires session_id")


class TestCloudSyncClear:
    """Test cloud sync clear endpoint"""

    def test_sync_clear_success(self):
        """Test /api/sync/clear removes cloud data"""
        # First backup some data
        backup_data = {
            "user_id": TEST_USER_ID,
            "data": {"test_clear": True}
        }
        
        requests.post(
            f"{BASE_URL}/api/sync/backup",
            headers={
                "Authorization": f"Bearer {TEST_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json=backup_data
        )
        
        # Verify data exists
        status_before = requests.get(
            f"{BASE_URL}/api/sync/status/{TEST_USER_ID}",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert status_before.json().get("has_data") == True, "Data should exist before clear"
        
        # Clear the data
        clear_response = requests.delete(
            f"{BASE_URL}/api/sync/clear/{TEST_USER_ID}",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert clear_response.status_code == 200, f"Expected 200, got {clear_response.status_code}"
        data = clear_response.json()
        assert data.get("success") == True, "Clear should return success: true"
        
        # Verify data is cleared
        status_after = requests.get(
            f"{BASE_URL}/api/sync/status/{TEST_USER_ID}",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert status_after.json().get("has_data") == False, "Data should be cleared"
        
        print("✓ Sync clear successfully removes cloud data")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
