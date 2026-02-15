"""
Backend API tests for Recurring Items feature
Tests CRUD operations for recurring items and dose logging
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://vendor-track-5.preview.emergentagent.com').rstrip('/')


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def test_item_id():
    """Generate unique test item name prefix"""
    return f"TEST_{uuid.uuid4().hex[:8]}"


class TestRecurringItemsHealth:
    """Health check for API"""
    
    def test_api_health(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("API health check passed")


class TestRecurringItemsCRUD:
    """Recurring Items CRUD operations"""
    
    def test_create_daily_recurring_item(self, api_client, test_item_id):
        """Test creating a daily recurring item"""
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "name": f"{test_item_id}_Daily_Peptide",
            "type": "Peptide",
            "dosage_amount": 250,
            "dosage_unit": "mcg",
            "route": "Subcutaneous",
            "recurrence_type": "daily",
            "recurrence_days": [],
            "recurrence_interval": 1,
            "times_of_day": ["Morning", "Evening"],
            "start_date": today,
            "notes": "Test daily recurring item",
            "category": "peptide",
            "reminder_enabled": False
        }
        
        response = api_client.post(f"{BASE_URL}/api/recurring-items", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "item_id" in data
        assert data["name"] == payload["name"]
        assert data["recurrence_type"] == "daily"
        assert data["is_active"] == True
        assert data["dosage_amount"] == 250
        print(f"Created daily recurring item: {data['item_id']}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/recurring-items/{data['item_id']}")
    
    def test_create_weekly_recurring_item(self, api_client, test_item_id):
        """Test creating a weekly recurring item with specific days"""
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "name": f"{test_item_id}_Weekly_Supplement",
            "type": "Supplement",
            "dosage_amount": 1000,
            "dosage_unit": "mg",
            "route": "Oral",
            "recurrence_type": "weekly",
            "recurrence_days": [1, 3, 5],  # Mon, Wed, Fri
            "recurrence_interval": 1,
            "times_of_day": ["Morning"],
            "start_date": today,
            "category": "supplement",
            "reminder_enabled": True
        }
        
        response = api_client.post(f"{BASE_URL}/api/recurring-items", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["recurrence_type"] == "weekly"
        assert data["recurrence_days"] == [1, 3, 5]
        assert data["reminder_enabled"] == True
        print(f"Created weekly recurring item: {data['item_id']}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/recurring-items/{data['item_id']}")
    
    def test_create_biweekly_recurring_item(self, api_client, test_item_id):
        """Test creating a biweekly recurring item"""
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "name": f"{test_item_id}_Biweekly_Med",
            "type": "Medication",
            "dosage_amount": 50,
            "dosage_unit": "mg",
            "route": "Oral",
            "recurrence_type": "biweekly",
            "recurrence_days": [2, 4],  # Tue, Thu
            "recurrence_interval": 2,
            "times_of_day": ["Evening"],
            "start_date": today,
            "category": "medication"
        }
        
        response = api_client.post(f"{BASE_URL}/api/recurring-items", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["recurrence_type"] == "biweekly"
        print(f"Created biweekly recurring item: {data['item_id']}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/recurring-items/{data['item_id']}")
    
    def test_create_monthly_recurring_item(self, api_client, test_item_id):
        """Test creating a monthly recurring item"""
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "name": f"{test_item_id}_Monthly_Item",
            "type": "Other",
            "dosage_amount": 1,
            "dosage_unit": "tablets",
            "route": "Oral",
            "recurrence_type": "monthly",
            "recurrence_days": [],
            "recurrence_interval": 1,
            "times_of_day": ["Morning"],
            "start_date": today,
            "category": "other"
        }
        
        response = api_client.post(f"{BASE_URL}/api/recurring-items", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["recurrence_type"] == "monthly"
        print(f"Created monthly recurring item: {data['item_id']}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/recurring-items/{data['item_id']}")
    
    def test_create_custom_interval_recurring_item(self, api_client, test_item_id):
        """Test creating a custom interval recurring item"""
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "name": f"{test_item_id}_Custom_Interval",
            "type": "Peptide",
            "dosage_amount": 100,
            "dosage_unit": "mcg",
            "route": "Intramuscular",
            "recurrence_type": "custom",
            "recurrence_days": [],
            "recurrence_interval": 3,  # Every 3 days
            "times_of_day": ["Afternoon"],
            "start_date": today,
            "category": "peptide"
        }
        
        response = api_client.post(f"{BASE_URL}/api/recurring-items", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["recurrence_type"] == "custom"
        assert data["recurrence_interval"] == 3
        print(f"Created custom interval recurring item: {data['item_id']}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/recurring-items/{data['item_id']}")
    
    def test_get_all_recurring_items(self, api_client):
        """Test getting all recurring items"""
        response = api_client.get(f"{BASE_URL}/api/recurring-items")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Retrieved {len(data)} recurring items")
    
    def test_get_recurring_item_by_id(self, api_client, test_item_id):
        """Test getting a specific recurring item by ID"""
        # First create an item
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "name": f"{test_item_id}_GetById",
            "type": "Peptide",
            "dosage_amount": 200,
            "dosage_unit": "mcg",
            "route": "Subcutaneous",
            "recurrence_type": "daily",
            "recurrence_days": [],
            "recurrence_interval": 1,
            "times_of_day": ["Morning"],
            "start_date": today,
            "category": "peptide"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/recurring-items", json=payload)
        created_item = create_response.json()
        item_id = created_item["item_id"]
        
        # Get by ID
        get_response = api_client.get(f"{BASE_URL}/api/recurring-items/{item_id}")
        assert get_response.status_code == 200
        
        fetched_item = get_response.json()
        assert fetched_item["item_id"] == item_id
        assert fetched_item["name"] == payload["name"]
        print(f"Successfully fetched item by ID: {item_id}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/recurring-items/{item_id}")
    
    def test_update_recurring_item(self, api_client, test_item_id):
        """Test updating a recurring item"""
        # Create
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "name": f"{test_item_id}_Update",
            "type": "Peptide",
            "dosage_amount": 100,
            "dosage_unit": "mcg",
            "route": "Subcutaneous",
            "recurrence_type": "daily",
            "recurrence_days": [],
            "recurrence_interval": 1,
            "times_of_day": ["Morning"],
            "start_date": today,
            "category": "peptide"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/recurring-items", json=payload)
        created_item = create_response.json()
        item_id = created_item["item_id"]
        
        # Update
        update_payload = {
            "name": f"{test_item_id}_Update_Modified",
            "dosage_amount": 300,
            "times_of_day": ["Morning", "Evening"],
            "notes": "Updated notes"
        }
        
        update_response = api_client.put(f"{BASE_URL}/api/recurring-items/{item_id}", json=update_payload)
        assert update_response.status_code == 200
        
        updated_item = update_response.json()
        assert updated_item["dosage_amount"] == 300
        assert updated_item["times_of_day"] == ["Morning", "Evening"]
        assert updated_item["notes"] == "Updated notes"
        print(f"Successfully updated item: {item_id}")
        
        # Verify update persisted
        verify_response = api_client.get(f"{BASE_URL}/api/recurring-items/{item_id}")
        verified = verify_response.json()
        assert verified["dosage_amount"] == 300
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/recurring-items/{item_id}")
    
    def test_delete_recurring_item_soft_delete(self, api_client, test_item_id):
        """Test soft deleting a recurring item"""
        # Create
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "name": f"{test_item_id}_Delete",
            "type": "Peptide",
            "dosage_amount": 100,
            "dosage_unit": "mcg",
            "route": "Subcutaneous",
            "recurrence_type": "daily",
            "recurrence_days": [],
            "recurrence_interval": 1,
            "times_of_day": ["Morning"],
            "start_date": today,
            "category": "peptide"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/recurring-items", json=payload)
        created_item = create_response.json()
        item_id = created_item["item_id"]
        
        # Delete
        delete_response = api_client.delete(f"{BASE_URL}/api/recurring-items/{item_id}")
        assert delete_response.status_code == 200
        
        delete_data = delete_response.json()
        assert delete_data["message"] == "Deleted"
        print(f"Successfully soft deleted item: {item_id}")
        
        # Verify not in active items list
        list_response = api_client.get(f"{BASE_URL}/api/recurring-items?active_only=true")
        items = list_response.json()
        item_ids = [i["item_id"] for i in items]
        assert item_id not in item_ids, "Deleted item should not appear in active items list"
    
    def test_get_nonexistent_item_returns_404(self, api_client):
        """Test that getting a non-existent item returns 404"""
        response = api_client.get(f"{BASE_URL}/api/recurring-items/nonexistent_id_12345")
        assert response.status_code == 404
        print("Correctly returned 404 for non-existent item")


class TestScheduleForDate:
    """Test schedule endpoint that returns items for a specific date"""
    
    def test_get_schedule_for_today(self, api_client, test_item_id):
        """Test getting scheduled items for today"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Create a daily item that should appear
        payload = {
            "name": f"{test_item_id}_Today_Schedule",
            "type": "Peptide",
            "dosage_amount": 250,
            "dosage_unit": "mcg",
            "route": "Subcutaneous",
            "recurrence_type": "daily",
            "recurrence_days": [],
            "recurrence_interval": 1,
            "times_of_day": ["Morning"],
            "start_date": today,
            "category": "peptide"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/recurring-items", json=payload)
        created_item = create_response.json()
        item_id = created_item["item_id"]
        
        # Get schedule for today
        schedule_response = api_client.get(f"{BASE_URL}/api/recurring-items/schedule/{today}")
        assert schedule_response.status_code == 200
        
        schedule = schedule_response.json()
        assert isinstance(schedule, list)
        
        # Our item should be in the schedule
        item_ids = [i["item_id"] for i in schedule]
        assert item_id in item_ids, "Daily item should appear in today's schedule"
        print(f"Schedule for {today} contains {len(schedule)} items including test item")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/recurring-items/{item_id}")
    
    def test_schedule_excludes_future_start_date(self, api_client, test_item_id):
        """Test that items with future start date don't appear in today's schedule"""
        today = datetime.now().strftime("%Y-%m-%d")
        future_date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
        
        # Create an item starting in the future
        payload = {
            "name": f"{test_item_id}_Future_Start",
            "type": "Peptide",
            "dosage_amount": 250,
            "dosage_unit": "mcg",
            "route": "Subcutaneous",
            "recurrence_type": "daily",
            "recurrence_days": [],
            "recurrence_interval": 1,
            "times_of_day": ["Morning"],
            "start_date": future_date,
            "category": "peptide"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/recurring-items", json=payload)
        created_item = create_response.json()
        item_id = created_item["item_id"]
        
        # Get schedule for today
        schedule_response = api_client.get(f"{BASE_URL}/api/recurring-items/schedule/{today}")
        schedule = schedule_response.json()
        
        item_ids = [i["item_id"] for i in schedule]
        assert item_id not in item_ids, "Future start date item should NOT appear in today's schedule"
        print("Future start date items correctly excluded from today's schedule")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/recurring-items/{item_id}")


class TestDoseLogging:
    """Test dose logging endpoints"""
    
    def test_log_dose_taken(self, api_client, test_item_id):
        """Test logging a dose as taken"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Create an item first
        item_payload = {
            "name": f"{test_item_id}_DoseLog",
            "type": "Peptide",
            "dosage_amount": 250,
            "dosage_unit": "mcg",
            "route": "Subcutaneous",
            "recurrence_type": "daily",
            "recurrence_days": [],
            "recurrence_interval": 1,
            "times_of_day": ["Morning"],
            "start_date": today,
            "category": "peptide"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/recurring-items", json=item_payload)
        created_item = create_response.json()
        item_id = created_item["item_id"]
        
        # Log dose as taken
        log_payload = {
            "recurring_item_id": item_id,
            "scheduled_date": today,
            "scheduled_time": "Morning",
            "status": "taken"
        }
        
        log_response = api_client.post(f"{BASE_URL}/api/recurring-items/dose-log", json=log_payload)
        assert log_response.status_code == 200
        
        log_data = log_response.json()
        assert log_data["status"] == "taken"
        assert log_data["recurring_item_id"] == item_id
        print(f"Successfully logged dose as taken for item: {item_id}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/recurring-items/{item_id}")
    
    def test_log_dose_skipped_with_reason(self, api_client, test_item_id):
        """Test logging a dose as skipped with reason"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Create item
        item_payload = {
            "name": f"{test_item_id}_SkipLog",
            "type": "Peptide",
            "dosage_amount": 250,
            "dosage_unit": "mcg",
            "route": "Subcutaneous",
            "recurrence_type": "daily",
            "recurrence_days": [],
            "recurrence_interval": 1,
            "times_of_day": ["Morning"],
            "start_date": today,
            "category": "peptide"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/recurring-items", json=item_payload)
        created_item = create_response.json()
        item_id = created_item["item_id"]
        
        # Log dose as skipped
        log_payload = {
            "recurring_item_id": item_id,
            "scheduled_date": today,
            "scheduled_time": "Morning",
            "status": "skipped",
            "reason": "Feeling unwell"
        }
        
        log_response = api_client.post(f"{BASE_URL}/api/recurring-items/dose-log", json=log_payload)
        assert log_response.status_code == 200
        
        log_data = log_response.json()
        assert log_data["status"] == "skipped"
        assert log_data["reason"] == "Feeling unwell"
        print(f"Successfully logged dose as skipped with reason")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/recurring-items/{item_id}")
    
    def test_log_dose_delayed(self, api_client, test_item_id):
        """Test logging a dose as delayed"""
        today = datetime.now().strftime("%Y-%m-%d")
        actual_time = datetime.now().isoformat()
        
        # Create item
        item_payload = {
            "name": f"{test_item_id}_DelayLog",
            "type": "Peptide",
            "dosage_amount": 250,
            "dosage_unit": "mcg",
            "route": "Subcutaneous",
            "recurrence_type": "daily",
            "recurrence_days": [],
            "recurrence_interval": 1,
            "times_of_day": ["Morning"],
            "start_date": today,
            "category": "peptide"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/recurring-items", json=item_payload)
        created_item = create_response.json()
        item_id = created_item["item_id"]
        
        # Log dose as delayed
        log_payload = {
            "recurring_item_id": item_id,
            "scheduled_date": today,
            "scheduled_time": "Morning",
            "status": "delayed",
            "reason": "Took later in the day",
            "actual_time": actual_time
        }
        
        log_response = api_client.post(f"{BASE_URL}/api/recurring-items/dose-log", json=log_payload)
        assert log_response.status_code == 200
        
        log_data = log_response.json()
        assert log_data["status"] == "delayed"
        print(f"Successfully logged dose as delayed")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/recurring-items/{item_id}")
    
    def test_get_dose_logs_for_date(self, api_client, test_item_id):
        """Test getting all dose logs for a specific date"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Create item
        item_payload = {
            "name": f"{test_item_id}_GetLogs",
            "type": "Peptide",
            "dosage_amount": 250,
            "dosage_unit": "mcg",
            "route": "Subcutaneous",
            "recurrence_type": "daily",
            "recurrence_days": [],
            "recurrence_interval": 1,
            "times_of_day": ["Morning", "Evening"],
            "start_date": today,
            "category": "peptide"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/recurring-items", json=item_payload)
        created_item = create_response.json()
        item_id = created_item["item_id"]
        
        # Log morning dose
        api_client.post(f"{BASE_URL}/api/recurring-items/dose-log", json={
            "recurring_item_id": item_id,
            "scheduled_date": today,
            "scheduled_time": "Morning",
            "status": "taken"
        })
        
        # Log evening dose
        api_client.post(f"{BASE_URL}/api/recurring-items/dose-log", json={
            "recurring_item_id": item_id,
            "scheduled_date": today,
            "scheduled_time": "Evening",
            "status": "skipped"
        })
        
        # Get dose logs for today
        logs_response = api_client.get(f"{BASE_URL}/api/recurring-items/dose-logs/{today}")
        assert logs_response.status_code == 200
        
        logs = logs_response.json()
        assert isinstance(logs, list)
        print(f"Retrieved {len(logs)} dose logs for {today}")
        
        # Filter logs for our test item
        item_logs = [l for l in logs if l["recurring_item_id"] == item_id]
        assert len(item_logs) >= 2, "Should have at least 2 logs for our test item"
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/recurring-items/{item_id}")


class TestEdgeCases:
    """Test edge cases and validation"""
    
    def test_delete_nonexistent_item_returns_404(self, api_client):
        """Test that deleting a non-existent item returns 404"""
        response = api_client.delete(f"{BASE_URL}/api/recurring-items/nonexistent_12345")
        assert response.status_code == 404
        print("Correctly returned 404 for deleting non-existent item")
    
    def test_update_nonexistent_item_returns_404(self, api_client):
        """Test that updating a non-existent item returns 404"""
        update_payload = {"name": "Updated Name"}
        response = api_client.put(f"{BASE_URL}/api/recurring-items/nonexistent_12345", json=update_payload)
        assert response.status_code == 404
        print("Correctly returned 404 for updating non-existent item")
    
    def test_update_with_empty_payload_returns_400(self, api_client, test_item_id):
        """Test that updating with empty payload returns 400"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Create item first
        item_payload = {
            "name": f"{test_item_id}_EmptyUpdate",
            "type": "Peptide",
            "dosage_amount": 250,
            "dosage_unit": "mcg",
            "route": "Subcutaneous",
            "recurrence_type": "daily",
            "recurrence_days": [],
            "recurrence_interval": 1,
            "times_of_day": ["Morning"],
            "start_date": today,
            "category": "peptide"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/recurring-items", json=item_payload)
        created_item = create_response.json()
        item_id = created_item["item_id"]
        
        # Try empty update
        response = api_client.put(f"{BASE_URL}/api/recurring-items/{item_id}", json={})
        assert response.status_code == 400
        print("Correctly returned 400 for empty update payload")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/recurring-items/{item_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
