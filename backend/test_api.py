import requests
import time
import sys

BASE_URL = "http://localhost:8000/api"

def test_backend():
    print("Testing Backend API...")
    
    # 1. Test Config
    print("1. Setting Config...")
    config = {
        "target_organizations": ["Clan del Golfo"],
        "local_combos": [],
        "date_range_start": "2023-01-01",
        "predictor_events": ["Captura"],
        "predictor_ranks": ["Cabecilla"],
        "target_crimes": ["Homicidio"]
    }
    try:
        res = requests.post(f"{BASE_URL}/config", json=config)
        assert res.status_code == 200
        print("   Config OK")
    except Exception as e:
        print(f"   Config FAILED: {e}")
        return

    # 2. Start Scraping
    print("2. Starting Scraping...")
    try:
        res = requests.post(f"{BASE_URL}/scrape")
        assert res.status_code == 200
        print("   Scraping Started OK")
    except Exception as e:
        print(f"   Scraping Start FAILED: {e}")
        return

    # 3. Poll Status
    print("3. Polling Status...")
    for _ in range(10):
        try:
            res = requests.get(f"{BASE_URL}/status")
            data = res.json()
            stage = data['stage']
            print(f"   Stage: {stage}")
            if stage == 'DATA_PREVIEW':
                print("   Reached DATA_PREVIEW OK")
                break
            time.sleep(1)
        except Exception as e:
            print(f"   Polling FAILED: {e}")
            break
            
    # 4. Get Data
    print("4. Getting Data...")
    try:
        res = requests.get(f"{BASE_URL}/data")
        items = res.json()
        print(f"   Got {len(items)} items. OK")
    except Exception as e:
        print(f"   Get Data FAILED: {e}")

    # 5. Start Training
    print("5. Starting Training...")
    try:
        res = requests.post(f"{BASE_URL}/train")
        assert res.status_code == 200
        print("   Training Started OK")
    except Exception as e:
        print(f"   Training Start FAILED: {e}")

    # 6. Poll for Dashboard
    print("6. Polling for Dashboard...")
    for _ in range(10):
        try:
            res = requests.get(f"{BASE_URL}/status")
            data = res.json()
            stage = data['stage']
            print(f"   Stage: {stage}")
            if stage == 'DASHBOARD':
                print("   Reached DASHBOARD OK")
                break
            time.sleep(1)
        except Exception as e:
            print(f"   Polling FAILED: {e}")
            break

    # 7. Get Result
    print("7. Getting Result...")
    try:
        res = requests.get(f"{BASE_URL}/result")
        result = res.json()
        if result:
            print(f"   Got Result. Risk Score: {result['risk_score']}. OK")
        else:
            print("   Result is None (Failed?)")
    except Exception as e:
        print(f"   Get Result FAILED: {e}")

if __name__ == "__main__":
    test_backend()
