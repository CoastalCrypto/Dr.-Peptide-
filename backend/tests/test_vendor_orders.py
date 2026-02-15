"""
Backend API Tests for Vendor Management and Order Tracking Feature
Tests vendor CRUD operations and order CRUD operations including:
- POST /api/vendors - Create vendor
- GET /api/vendors - List all vendors  
- PUT /api/vendors/{vendor_id} - Update vendor
- DELETE /api/vendors/{vendor_id} - Soft delete vendor
- POST /api/orders - Create order with vendor reference
- GET /api/orders - List all orders
- PUT /api/orders/{order_id} - Update order status
- GET /api/vendors/{vendor_id}/orders - Get orders for specific vendor
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://wellness-hub-580.preview.emergentagent.com').rstrip('/')


class TestVendorCRUD:
    """Test Vendor CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data prefix for cleanup"""
        self.test_prefix = f"TEST_{uuid.uuid4().hex[:8]}"
        yield
    
    def test_create_vendor_success(self):
        """POST /api/vendors - Create vendor with all fields"""
        vendor_data = {
            "name": f"{self.test_prefix}_Peptide Pro Vendor",
            "website": "https://peptidepro.test.com",
            "email": "contact@peptidepro.test.com",
            "phone": "+1-555-123-4567",
            "payment_methods": ["Crypto", "Credit Card", "Wire Transfer"],
            "notes": "Test vendor for automated testing",
            "rating": 4,
            "is_domestic": True,
            "ships_to": ["US", "Canada"],
            "avg_shipping_days": 5
        }
        
        response = requests.post(f"{BASE_URL}/api/vendors", json=vendor_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "vendor_id" in data, "vendor_id should be generated"
        assert data["name"] == vendor_data["name"]
        assert data["website"] == vendor_data["website"]
        assert data["email"] == vendor_data["email"]
        assert data["rating"] == 4
        assert data["is_domestic"] == True
        assert data["payment_methods"] == ["Crypto", "Credit Card", "Wire Transfer"]
        assert data["is_active"] == True
        assert "created_at" in data
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/vendors/{data['vendor_id']}")
        print(f"✓ Vendor created successfully with vendor_id: {data['vendor_id']}")
    
    def test_create_vendor_minimal(self):
        """POST /api/vendors - Create vendor with minimal required fields"""
        vendor_data = {"name": f"{self.test_prefix}_MinimalVendor"}
        
        response = requests.post(f"{BASE_URL}/api/vendors", json=vendor_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["name"] == vendor_data["name"]
        assert data["payment_methods"] == []  # Default empty
        assert data["is_domestic"] == True  # Default
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/vendors/{data['vendor_id']}")
        print(f"✓ Minimal vendor created successfully")
    
    def test_get_all_vendors(self):
        """GET /api/vendors - Retrieve all active vendors"""
        # First create a vendor
        vendor_data = {"name": f"{self.test_prefix}_GetAllTestVendor", "rating": 3}
        create_resp = requests.post(f"{BASE_URL}/api/vendors", json=vendor_data)
        vendor_id = create_resp.json()["vendor_id"]
        
        # Get all vendors
        response = requests.get(f"{BASE_URL}/api/vendors")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Find our created vendor
        found = [v for v in data if v["vendor_id"] == vendor_id]
        assert len(found) == 1, "Created vendor should be in the list"
        assert found[0]["name"] == vendor_data["name"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/vendors/{vendor_id}")
        print(f"✓ GET /api/vendors returns list of vendors")
    
    def test_get_vendor_by_id(self):
        """GET /api/vendors/{vendor_id} - Retrieve specific vendor"""
        # Create vendor
        vendor_data = {"name": f"{self.test_prefix}_GetByIdVendor", "email": "getbyid@test.com"}
        create_resp = requests.post(f"{BASE_URL}/api/vendors", json=vendor_data)
        vendor_id = create_resp.json()["vendor_id"]
        
        # Get by ID
        response = requests.get(f"{BASE_URL}/api/vendors/{vendor_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["vendor_id"] == vendor_id
        assert data["name"] == vendor_data["name"]
        assert data["email"] == "getbyid@test.com"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/vendors/{vendor_id}")
        print(f"✓ GET /api/vendors/{{vendor_id}} returns correct vendor")
    
    def test_update_vendor(self):
        """PUT /api/vendors/{vendor_id} - Update vendor details"""
        # Create vendor
        vendor_data = {"name": f"{self.test_prefix}_UpdateVendor", "rating": 2}
        create_resp = requests.post(f"{BASE_URL}/api/vendors", json=vendor_data)
        vendor_id = create_resp.json()["vendor_id"]
        
        # Update
        update_data = {
            "name": f"{self.test_prefix}_UpdatedVendorName",
            "rating": 5,
            "payment_methods": ["PayPal", "Zelle"],
            "avg_shipping_days": 3
        }
        response = requests.put(f"{BASE_URL}/api/vendors/{vendor_id}", json=update_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["rating"] == 5
        assert data["payment_methods"] == ["PayPal", "Zelle"]
        assert data["avg_shipping_days"] == 3
        assert "updated_at" in data
        
        # Verify persistence with GET
        verify_resp = requests.get(f"{BASE_URL}/api/vendors/{vendor_id}")
        verify_data = verify_resp.json()
        assert verify_data["rating"] == 5, "Update should persist"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/vendors/{vendor_id}")
        print(f"✓ Vendor updated successfully")
    
    def test_delete_vendor_soft_delete(self):
        """DELETE /api/vendors/{vendor_id} - Soft delete vendor"""
        # Create vendor
        vendor_data = {"name": f"{self.test_prefix}_DeleteVendor"}
        create_resp = requests.post(f"{BASE_URL}/api/vendors", json=vendor_data)
        vendor_id = create_resp.json()["vendor_id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/vendors/{vendor_id}")
        assert response.status_code == 200
        assert response.json()["message"] == "Deleted"
        
        # Verify not in active list
        list_resp = requests.get(f"{BASE_URL}/api/vendors?active_only=true")
        active_vendors = [v for v in list_resp.json() if v["vendor_id"] == vendor_id]
        assert len(active_vendors) == 0, "Deleted vendor should not appear in active list"
        
        print(f"✓ Vendor soft deleted successfully")
    
    def test_vendor_not_found(self):
        """GET/PUT/DELETE /api/vendors/{vendor_id} - 404 for non-existent"""
        fake_id = "vendor_nonexistent123"
        
        get_resp = requests.get(f"{BASE_URL}/api/vendors/{fake_id}")
        assert get_resp.status_code == 404
        
        put_resp = requests.put(f"{BASE_URL}/api/vendors/{fake_id}", json={"name": "test"})
        assert put_resp.status_code == 404
        
        delete_resp = requests.delete(f"{BASE_URL}/api/vendors/{fake_id}")
        assert delete_resp.status_code == 404
        
        print(f"✓ 404 returned for non-existent vendor")


class TestOrderCRUD:
    """Test Order CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Create test vendor for orders"""
        self.test_prefix = f"TEST_{uuid.uuid4().hex[:8]}"
        vendor_data = {"name": f"{self.test_prefix}_OrderTestVendor"}
        resp = requests.post(f"{BASE_URL}/api/vendors", json=vendor_data)
        self.vendor = resp.json()
        yield
        # Cleanup vendor
        requests.delete(f"{BASE_URL}/api/vendors/{self.vendor['vendor_id']}")
    
    def test_create_order_success(self):
        """POST /api/orders - Create order with all fields"""
        order_data = {
            "vendor_id": self.vendor["vendor_id"],
            "order_number": f"ORD-{self.test_prefix}",
            "order_date": "2026-02-15",
            "items": ["BPC-157 5mg", "TB-500 10mg", "Ipamorelin 5mg"],
            "total_amount": 249.99,
            "currency": "USD",
            "status": "pending",
            "tracking_number": "1Z999AA10123456789",
            "tracking_url": "https://track.example.com/1Z999AA10123456789",
            "expected_delivery": "2026-02-20",
            "notes": "Test order for automated testing"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "order_id" in data, "order_id should be generated"
        assert data["vendor_id"] == self.vendor["vendor_id"]
        assert data["vendor_name"] == self.vendor["name"]  # Denormalized
        assert data["order_number"] == order_data["order_number"]
        assert data["items"] == order_data["items"]
        assert data["total_amount"] == 249.99
        assert data["status"] == "pending"
        assert data["tracking_number"] == order_data["tracking_number"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/orders/{data['order_id']}")
        print(f"✓ Order created successfully with order_id: {data['order_id']}")
    
    def test_create_order_minimal(self):
        """POST /api/orders - Create order with minimal required fields"""
        order_data = {
            "vendor_id": self.vendor["vendor_id"],
            "order_date": "2026-02-15"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "pending"  # Default
        assert data["currency"] == "USD"  # Default
        assert data["items"] == []  # Default empty
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/orders/{data['order_id']}")
        print(f"✓ Minimal order created successfully")
    
    def test_create_order_invalid_vendor(self):
        """POST /api/orders - 404 for non-existent vendor"""
        order_data = {
            "vendor_id": "vendor_nonexistent",
            "order_date": "2026-02-15"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ 404 returned for invalid vendor_id")
    
    def test_get_all_orders(self):
        """GET /api/orders - Retrieve all orders"""
        # Create order
        order_data = {
            "vendor_id": self.vendor["vendor_id"],
            "order_date": "2026-02-15",
            "status": "shipped"
        }
        create_resp = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        order_id = create_resp.json()["order_id"]
        
        # Get all
        response = requests.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        found = [o for o in data if o["order_id"] == order_id]
        assert len(found) == 1
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/orders/{order_id}")
        print(f"✓ GET /api/orders returns list of orders")
    
    def test_get_orders_by_vendor(self):
        """GET /api/orders?vendor_id={id} - Filter orders by vendor"""
        # Create order
        order_data = {
            "vendor_id": self.vendor["vendor_id"],
            "order_date": "2026-02-15"
        }
        create_resp = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        order_id = create_resp.json()["order_id"]
        
        # Get by vendor
        response = requests.get(f"{BASE_URL}/api/orders?vendor_id={self.vendor['vendor_id']}")
        assert response.status_code == 200
        
        data = response.json()
        assert all(o["vendor_id"] == self.vendor["vendor_id"] for o in data)
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/orders/{order_id}")
        print(f"✓ Orders filtered by vendor_id")
    
    def test_get_orders_by_status(self):
        """GET /api/orders?status={status} - Filter orders by status"""
        # Create delivered order
        order_data = {
            "vendor_id": self.vendor["vendor_id"],
            "order_date": "2026-02-15",
            "status": "delivered"
        }
        create_resp = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        order_id = create_resp.json()["order_id"]
        
        # Get by status
        response = requests.get(f"{BASE_URL}/api/orders?status=delivered")
        assert response.status_code == 200
        
        data = response.json()
        assert all(o["status"] == "delivered" for o in data)
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/orders/{order_id}")
        print(f"✓ Orders filtered by status")
    
    def test_update_order_status(self):
        """PUT /api/orders/{order_id} - Update order status and tracking"""
        # Create order
        order_data = {
            "vendor_id": self.vendor["vendor_id"],
            "order_date": "2026-02-15",
            "status": "pending"
        }
        create_resp = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        order_id = create_resp.json()["order_id"]
        
        # Update status to shipped with tracking
        update_data = {
            "status": "shipped",
            "tracking_number": "TRACK123456",
            "expected_delivery": "2026-02-22"
        }
        response = requests.put(f"{BASE_URL}/api/orders/{order_id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "shipped"
        assert data["tracking_number"] == "TRACK123456"
        assert data["expected_delivery"] == "2026-02-22"
        assert "updated_at" in data
        
        # Verify persistence
        verify_resp = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert verify_resp.json()["status"] == "shipped"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/orders/{order_id}")
        print(f"✓ Order status updated successfully")
    
    def test_update_order_to_delivered(self):
        """PUT /api/orders/{order_id} - Update order to delivered with actual delivery date"""
        # Create shipped order
        order_data = {
            "vendor_id": self.vendor["vendor_id"],
            "order_date": "2026-02-15",
            "status": "shipped"
        }
        create_resp = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        order_id = create_resp.json()["order_id"]
        
        # Update to delivered
        update_data = {
            "status": "delivered",
            "actual_delivery": "2026-02-20"
        }
        response = requests.put(f"{BASE_URL}/api/orders/{order_id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "delivered"
        assert data["actual_delivery"] == "2026-02-20"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/orders/{order_id}")
        print(f"✓ Order marked as delivered")
    
    def test_delete_order(self):
        """DELETE /api/orders/{order_id} - Hard delete order"""
        # Create order
        order_data = {
            "vendor_id": self.vendor["vendor_id"],
            "order_date": "2026-02-15"
        }
        create_resp = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        order_id = create_resp.json()["order_id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/orders/{order_id}")
        assert response.status_code == 200
        assert response.json()["message"] == "Deleted"
        
        # Verify deleted
        get_resp = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert get_resp.status_code == 404
        
        print(f"✓ Order deleted successfully")
    
    def test_get_vendor_orders_endpoint(self):
        """GET /api/vendors/{vendor_id}/orders - Get all orders for specific vendor"""
        # Create multiple orders
        order1 = requests.post(f"{BASE_URL}/api/orders", json={
            "vendor_id": self.vendor["vendor_id"],
            "order_date": "2026-02-10",
            "items": ["Item A"]
        }).json()
        
        order2 = requests.post(f"{BASE_URL}/api/orders", json={
            "vendor_id": self.vendor["vendor_id"],
            "order_date": "2026-02-15",
            "items": ["Item B"]
        }).json()
        
        # Get vendor orders
        response = requests.get(f"{BASE_URL}/api/vendors/{self.vendor['vendor_id']}/orders")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2
        
        order_ids = [o["order_id"] for o in data]
        assert order1["order_id"] in order_ids
        assert order2["order_id"] in order_ids
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/orders/{order1['order_id']}")
        requests.delete(f"{BASE_URL}/api/orders/{order2['order_id']}")
        print(f"✓ GET /api/vendors/{{vendor_id}}/orders returns vendor's orders")


class TestVendorOrderIntegration:
    """Test integration between vendors and orders"""
    
    def test_order_references_vendor_name(self):
        """Orders should have denormalized vendor_name"""
        # Create vendor
        vendor_resp = requests.post(f"{BASE_URL}/api/vendors", json={"name": "TEST_IntegrationVendor"})
        vendor = vendor_resp.json()
        
        # Create order
        order_resp = requests.post(f"{BASE_URL}/api/orders", json={
            "vendor_id": vendor["vendor_id"],
            "order_date": "2026-02-15"
        })
        order = order_resp.json()
        
        assert order["vendor_name"] == "TEST_IntegrationVendor"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/orders/{order['order_id']}")
        requests.delete(f"{BASE_URL}/api/vendors/{vendor['vendor_id']}")
        print(f"✓ Order correctly references vendor name")
    
    def test_order_status_transitions(self):
        """Test all valid order status transitions"""
        # Create vendor
        vendor_resp = requests.post(f"{BASE_URL}/api/vendors", json={"name": "TEST_StatusVendor"})
        vendor = vendor_resp.json()
        
        # Create order
        order_resp = requests.post(f"{BASE_URL}/api/orders", json={
            "vendor_id": vendor["vendor_id"],
            "order_date": "2026-02-15",
            "status": "pending"
        })
        order = order_resp.json()
        
        # pending -> shipped
        resp = requests.put(f"{BASE_URL}/api/orders/{order['order_id']}", json={"status": "shipped"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "shipped"
        
        # shipped -> delivered
        resp = requests.put(f"{BASE_URL}/api/orders/{order['order_id']}", json={"status": "delivered"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "delivered"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/orders/{order['order_id']}")
        requests.delete(f"{BASE_URL}/api/vendors/{vendor['vendor_id']}")
        print(f"✓ Order status transitions work correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
