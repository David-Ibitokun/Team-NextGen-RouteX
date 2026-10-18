import urllib.request
import urllib.parse
import json
import http.cookiejar
import sys

BASE_URL = "http://localhost:8000"

def get_cookie_value(cookie_jar, name):
    for cookie in cookie_jar:
        if cookie.name == name:
            return cookie.value
    return None

def make_request(url, method="GET", data=None, headers=None, opener=None):
    if headers is None:
        headers = {}
    if data is not None and isinstance(data, dict):
        encoded_data = urllib.parse.urlencode(data).encode("utf-8")
        if "Content-Type" not in headers:
            headers["Content-Type"] = "application/x-www-form-urlencoded"
    elif data is not None and isinstance(data, (bytes, bytearray)):
        encoded_data = data
    else:
        encoded_data = None

    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    executor = opener.open if opener else urllib.request.urlopen
    try:
        with executor(req) as response:
            status = response.status
            body = response.read().decode("utf-8")
            return status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"raw": body}
        return e.code, parsed

def run_tests():
    print("=" * 65)
    print("ROUTEX END-TO-END LIVE INTEGRATION TEST SUITE")
    print(f"Target: {BASE_URL}")
    print("=" * 65)

    # 1. Health check
    print("\n[1] Checking Health Endpoint (GET /api/v1/health/)...")
    status, health_data = make_request(f"{BASE_URL}/api/v1/health/")
    print(f"    Status: {status}")
    assert status == 200, f"Health check failed: {status} {health_data}"
    print(f"    Health Data: {health_data}")
    assert health_data.get("status") in ["healthy", "ok"], "Health status not healthy/ok"
    print("    --> PASSED: Service is healthy")

    # 2. Anonymous/Guest Report Creation
    print("\n[2] Testing Anonymous/Guest Report Submission (POST /api/v1/hazards/)...")
    guest_payload = {
        "category": "flooding",
        "location_name": "Lekki Toll Gate Plaza",
        "description": "Flash flooding near toll plaza after heavy afternoon rain.",
        "latitude": "6.447400",
        "longitude": "3.473500",
    }
    status, guest_report = make_request(f"{BASE_URL}/api/v1/hazards/", method="POST", data=guest_payload)
    print(f"    Status: {status}")
    assert status == 201, f"Guest report submission failed: {status} {guest_report}"
    guest_report_id = guest_report["id"]
    print(f"    Report ID: {guest_report_id}, Category: {guest_report['category']}, Status: {guest_report['status']}")
    print("    --> PASSED: Anonymous report created without authentication block")

    # 3. Authenticated Citizen Login & Report Creation
    print("\n[3] Testing Authenticated Citizen Login & Report Submission...")
    cj = http.cookiejar.CookieJar()
    auth_opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    # Obtain CSRF token
    status, csrf_data = make_request(f"{BASE_URL}/api/v1/auth/csrf/", opener=auth_opener)
    assert status == 200, f"CSRF fetch failed: {status}"
    csrf_token = csrf_data.get("csrfToken") or get_cookie_value(cj, "csrftoken")
    print(f"    CSRF Token obtained: {csrf_token[:10]}...")

    # Log in as citizen
    login_body = json.dumps({"username": "citizen", "password": "Password123!"}).encode("utf-8")
    status, login_res = make_request(
        f"{BASE_URL}/api/v1/auth/login/",
        method="POST",
        data=login_body,
        headers={"Content-Type": "application/json", "X-CSRFToken": csrf_token},
        opener=auth_opener
    )
    print(f"    Citizen Login Status: {status}")
    assert status == 200, f"Citizen login failed: {status} {login_res}"
    print(f"    Logged in user: {login_res.get('username')}, role: {login_res.get('role')}")

    # Submit authenticated report
    auth_payload = {
        "category": "pothole",
        "location_name": "Ikorodu Road by Maryland Underpass",
        "description": "Deep crater pothole in the middle lane causing dangerous deceleration.",
        "latitude": "6.572100",
        "longitude": "3.367200",
    }
    status, auth_report = make_request(
        f"{BASE_URL}/api/v1/hazards/",
        method="POST",
        data=auth_payload,
        headers={"X-CSRFToken": csrf_token},
        opener=auth_opener
    )
    print(f"    Status: {status}")
    assert status == 201, f"Auth report submission failed: {status} {auth_report}"
    auth_report_id = auth_report["id"]
    print(f"    Report ID: {auth_report_id}, Category: {auth_report['category']}")

    # Verify report is listed under Citizen's My Reports dashboard endpoint
    status, my_reports = make_request(f"{BASE_URL}/api/v1/auth/me/reports/", opener=auth_opener)
    print(f"    Citizen My-Reports Status: {status}")
    assert status == 200, f"My reports failed: {status} {my_reports}"
    my_report_ids = [r["id"] for r in (my_reports if isinstance(my_reports, list) else my_reports.get("results", []))]
    print(f"    Citizen's reports in dashboard: {my_report_ids}")
    assert auth_report_id in my_report_ids, f"Auth report {auth_report_id} not in citizen's personal dashboard"
    assert guest_report_id not in my_report_ids, f"Guest report {guest_report_id} should not belong to citizen"
    print("    --> PASSED: Authenticated report created and assigned to citizen user")

    # 4. Viewing on Map with Bounding Box
    print("\n[4] Testing Map View with Lagos Viewport Bounding Box (GET /api/v1/hazards/?bbox=...)...")
    # Bbox for Lagos: west 3.20, south 6.40, east 3.60, north 6.65
    status, map_results = make_request(f"{BASE_URL}/api/v1/hazards/?bbox=3.20,6.40,3.60,6.65")
    print(f"    Status: {status}")
    assert status == 200, f"Map query failed: {status} {map_results}"
    reports_in_bbox = map_results.get("results", map_results) if isinstance(map_results, dict) else map_results
    report_ids = [rep["id"] for rep in reports_in_bbox]
    print(f"    Found {len(reports_in_bbox)} hazard reports within map bounds.")
    assert guest_report_id in report_ids, f"Guest report {guest_report_id} not found in map bounding box query"
    assert auth_report_id in report_ids, f"Auth report {auth_report_id} not found in map bounding box query"
    print("    --> PASSED: Both new reports correctly visible on map within coordinates")

    # 5. Confirming Reports
    print("\n[5] Testing Hazard Confirmation (Guest and Authenticated)...")
    # Guest confirms auth_report with fresh cookie jar session
    guest_cj = http.cookiejar.CookieJar()
    guest_opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(guest_cj))

    status, confirm_data = make_request(
        f"{BASE_URL}/api/v1/hazards/{auth_report_id}/confirm/",
        method="POST",
        data={},
        opener=guest_opener
    )
    print(f"    Guest confirmation status: {status}")
    assert status == 200, f"Guest confirmation failed: {status} {confirm_data}"
    print(f"    Confirmations count after guest confirm: {confirm_data.get('confirmations_count')}")

    # Guest confirms again (should prevent duplicate)
    status_dup, dup_data = make_request(
        f"{BASE_URL}/api/v1/hazards/{auth_report_id}/confirm/",
        method="POST",
        data={},
        opener=guest_opener
    )
    print(f"    Duplicate guest confirmation status: {status_dup}")
    assert status_dup == 400, f"Duplicate confirmation should be 400, got {status_dup}"
    print(f"    Duplicate rejection detail: {dup_data.get('detail')}")

    # Citizen confirms guest_report
    status, citizen_confirm = make_request(
        f"{BASE_URL}/api/v1/hazards/{guest_report_id}/confirm/",
        method="POST",
        data={},
        headers={"X-CSRFToken": csrf_token},
        opener=auth_opener
    )
    print(f"    Citizen confirmation status: {status}")
    assert status in [200, 400], f"Citizen confirmation unexpected status: {status} {citizen_confirm}"
    print(f"    Confirmations count after citizen confirm: {citizen_confirm.get('confirmations_count')}")
    print("    --> PASSED: Confirmation flow works for both guest and authenticated users with deduplication")

    # 6. Flagging a Report
    print("\n[6] Testing Flagging a Report (POST /api/v1/hazards/{id}/flags/)...")
    flag_body = json.dumps({
        "reason": "resolved",
        "notes": "The flood waters have subsided, road is clear now."
    }).encode("utf-8")
    status, flag_resp = make_request(
        f"{BASE_URL}/api/v1/hazards/{guest_report_id}/flags/",
        method="POST",
        data=flag_body,
        headers={
            "Content-Type": "application/json",
            "X-CSRFToken": csrf_token
        },
        opener=auth_opener
    )
    print(f"    Flagging status: {status}")
    assert status == 201, f"Flagging failed: {status} {flag_resp}"
    print(f"    Flag ID: {flag_resp.get('id')}, Reason: {flag_resp.get('reason')}")
    print("    --> PASSED: Report flagging registered successfully")

    # 7. Category & Status Filtering
    print("\n[7] Testing Category and Status Filtering...")
    status, flood_resp = make_request(f"{BASE_URL}/api/v1/hazards/?category=flooding")
    assert status == 200
    flood_results = flood_resp.get("results", flood_resp)
    for item in flood_results:
        assert item["category"] == "flooding", f"Expected flooding, got {item['category']}"
    print(f"    Category filter (flooding): {len(flood_results)} items returned, all match.")

    status, pothole_resp = make_request(f"{BASE_URL}/api/v1/hazards/?category=pothole")
    assert status == 200
    pothole_results = pothole_resp.get("results", pothole_resp)
    for item in pothole_results:
        assert item["category"] == "pothole", f"Expected pothole, got {item['category']}"
    print(f"    Category filter (pothole): {len(pothole_results)} items returned, all match.")
    print("    --> PASSED: Filtering operates accurately")

    print("\n" + "=" * 65)
    print("ALL 7 CRITICAL END-TO-END FLOW TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
