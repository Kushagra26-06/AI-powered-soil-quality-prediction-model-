import requests
import json

def test_api():
    base_url = "http://localhost:5000"
    
    print("Testing Soil Quality Prediction API...")
    print("=" * 50)
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Health Check: {response.status_code}")
        print(f"Response: {response.json()}")
        print()
    except Exception as e:
        print(f"Health check failed: {e}")
        return
    
    # Test features endpoint
    try:
        response = requests.get(f"{base_url}/features")
        print(f"Features Check: {response.status_code}")
        print(f"Response: {response.json()}")
        print()
    except Exception as e:
        print(f"Features check failed: {e}")
        return
    
    # Test prediction with sample data
    sample_data = {
        "N": 65.5,
        "P": 28.3,
        "K": 45.2,
        "ph": 6.8,
        "ec": 1.2,
        "oc": 2.8,
        "S": 15.4,
        "zn": 2.1,
        "fe": 25.6,
        "cu": 1.8,
        "B": 3.2
    }
    
    try:
        response = requests.post(f"{base_url}/predict", json=sample_data)
        print(f"Prediction Test: {response.status_code}")
        result = response.json()
        print(f"Prediction Result: {json.dumps(result, indent=2)}")
        
        if 'fertility_class' in result:
            print(f"\n✅ Prediction successful!")
            print(f"Fertility Class: {result['fertility_class']}")
            print(f"Is Fertile: {result['is_fertile']}")
            print(f"Confidence: {max(result['confidence_scores'].values()):.2%}")
        else:
            print(f"❌ Prediction failed: {result}")
            
    except Exception as e:
        print(f"Prediction test failed: {e}")

if __name__ == "__main__":
    test_api()
