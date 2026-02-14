"""
Backend API Tests for PepTrack Pro - Iteration 2
Tests custom peptide and medication CRUD endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL').rstrip('/')

class TestCustomPeptides:
    """Test custom peptide CRUD operations"""
    
    def test_create_custom_peptide_and_verify(self):
        """Create custom peptide and verify persistence via GET"""
        payload = {
            "name": "TEST_CustomPeptide1",
            "aliases": ["Test Alias 1", "Test Alias 2"],
            "categories": ["Weight Loss", "Muscle Growth"],
            "description": "Test custom peptide for automated testing",
            "mechanism": "Test mechanism of action",
            "dosage_low": "100-200 mcg/day",
            "dosage_moderate": "200-400 mcg/day",
            "dosage_higher": "400-600 mcg/day",
            "frequency": "Once daily",
            "cycle_length": "4-8 weeks",
            "routes": ["Subcutaneous", "Intramuscular"],
            "side_effects": ["Test side effect 1", "Test side effect 2"],
            "contraindications": ["Test contraindication"],
            "storage": "Refrigerate at 2-8°C",
            "default_vial_mg": 10.0,
            "default_dose_mcg": 500.0,
            "default_bac_water_ml": 2.0
        }
        
        response = requests.post(f"{BASE_URL}/api/custom/peptides", json=payload)
        print(f"Create peptide response status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        print(f"Created peptide: {data}")
        assert "peptide_id" in data
        assert data["name"] == payload["name"]
        assert data["is_custom"] == True
        assert len(data["categories"]) == 2
        
        peptide_id = data["peptide_id"]
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/custom/peptides")
        assert get_response.status_code == 200
        all_peptides = get_response.json()
        found = next((p for p in all_peptides if p["peptide_id"] == peptide_id), None)
        assert found is not None, "Created peptide not found in GET response"
        assert found["name"] == payload["name"]
        print("✓ Custom peptide persisted successfully")
    
    def test_get_all_custom_peptides(self):
        """Retrieve all custom peptides"""
        response = requests.get(f"{BASE_URL}/api/custom/peptides")
        print(f"GET all peptides status: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        print(f"Retrieved {len(data)} custom peptides")
        assert isinstance(data, list)
        print("✓ GET all custom peptides working")
    
    def test_delete_custom_peptide(self):
        """Create and then delete custom peptide"""
        # Create
        payload = {
            "name": "TEST_DeleteMe",
            "description": "Will be deleted"
        }
        create_response = requests.post(f"{BASE_URL}/api/custom/peptides", json=payload)
        assert create_response.status_code == 200
        peptide_id = create_response.json()["peptide_id"]
        print(f"Created peptide for deletion: {peptide_id}")
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/custom/peptides/{peptide_id}")
        print(f"Delete response status: {delete_response.status_code}")
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/custom/peptides")
        all_peptides = get_response.json()
        found = next((p for p in all_peptides if p["peptide_id"] == peptide_id), None)
        assert found is None, "Deleted peptide still exists"
        print("✓ Custom peptide deletion working")
    
    def test_delete_nonexistent_peptide(self):
        """Attempt to delete non-existent peptide should return 404"""
        response = requests.delete(f"{BASE_URL}/api/custom/peptides/fake_id_12345")
        print(f"Delete nonexistent peptide status: {response.status_code}")
        assert response.status_code == 404
        print("✓ Proper 404 for nonexistent peptide")


class TestCustomMedications:
    """Test custom medication CRUD operations"""
    
    def test_create_custom_medication_and_verify(self):
        """Create custom medication and verify persistence via GET"""
        payload = {
            "generic_name": "TEST_CustomMed1",
            "brand_names": ["Test Brand A", "Test Brand B"],
            "drug_class": "Test Drug Class",
            "uses": ["Test use 1", "Test use 2"],
            "standard_dosage": "100mg twice daily",
            "side_effects": ["Nausea", "Headache"],
            "contraindications": ["Pregnancy", "Liver disease"],
            "interactions": ["Warfarin", "Aspirin"],
            "timing": "Take with food"
        }
        
        response = requests.post(f"{BASE_URL}/api/custom/medications", json=payload)
        print(f"Create medication response status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        print(f"Created medication: {data}")
        assert "medication_id" in data
        assert data["generic_name"] == payload["generic_name"]
        assert data["is_custom"] == True
        assert len(data["brand_names"]) == 2
        
        med_id = data["medication_id"]
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/custom/medications")
        assert get_response.status_code == 200
        all_meds = get_response.json()
        found = next((m for m in all_meds if m["medication_id"] == med_id), None)
        assert found is not None, "Created medication not found in GET response"
        assert found["generic_name"] == payload["generic_name"]
        print("✓ Custom medication persisted successfully")
    
    def test_get_all_custom_medications(self):
        """Retrieve all custom medications"""
        response = requests.get(f"{BASE_URL}/api/custom/medications")
        print(f"GET all medications status: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        print(f"Retrieved {len(data)} custom medications")
        assert isinstance(data, list)
        print("✓ GET all custom medications working")
    
    def test_delete_custom_medication(self):
        """Create and then delete custom medication"""
        # Create
        payload = {
            "generic_name": "TEST_DeleteMed",
            "drug_class": "Will be deleted"
        }
        create_response = requests.post(f"{BASE_URL}/api/custom/medications", json=payload)
        assert create_response.status_code == 200
        med_id = create_response.json()["medication_id"]
        print(f"Created medication for deletion: {med_id}")
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/custom/medications/{med_id}")
        print(f"Delete response status: {delete_response.status_code}")
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/custom/medications")
        all_meds = get_response.json()
        found = next((m for m in all_meds if m["medication_id"] == med_id), None)
        assert found is None, "Deleted medication still exists"
        print("✓ Custom medication deletion working")
    
    def test_delete_nonexistent_medication(self):
        """Attempt to delete non-existent medication should return 404"""
        response = requests.delete(f"{BASE_URL}/api/custom/medications/fake_id_12345")
        print(f"Delete nonexistent medication status: {response.status_code}")
        assert response.status_code == 404
        print("✓ Proper 404 for nonexistent medication")


class TestHealthCheck:
    """Test basic API health"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        print(f"API root status: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        print(f"API response: {data}")
        assert data["status"] == "healthy"
        assert "version" in data
        print("✓ API health check passing")


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup test data before and after test run"""
    yield
    # Cleanup after tests
    print("\n🧹 Cleaning up test data...")
    try:
        peptides_response = requests.get(f"{BASE_URL}/api/custom/peptides")
        if peptides_response.status_code == 200:
            peptides = peptides_response.json()
            for p in peptides:
                if p["name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/custom/peptides/{p['peptide_id']}")
                    print(f"Deleted test peptide: {p['name']}")
        
        meds_response = requests.get(f"{BASE_URL}/api/custom/medications")
        if meds_response.status_code == 200:
            meds = meds_response.json()
            for m in meds:
                if m["generic_name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/custom/medications/{m['medication_id']}")
                    print(f"Deleted test medication: {m['generic_name']}")
        
        print("✓ Test data cleanup complete")
    except Exception as e:
        print(f"Cleanup warning: {e}")
