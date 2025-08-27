"""
Quick test of the EduBoost app endpoints
"""
import sys
sys.path.append('.')

from app import app

# Test the Flask app directly
with app.test_client() as client:
    print("🧪 Testing EduBoost Flask App")
    print("=" * 40)
    
    # Test health check
    print("Testing health check endpoint...")
    response = client.get('/')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.get_json()
        print(f"Service: {data['service']}")
        print(f"Version: {data['version']}")
        print("✅ Health check passed!")
    else:
        print("❌ Health check failed!")
        print(response.data.decode())
    
    print("\n" + "-" * 40)
    
    # Test performance endpoint
    print("Testing student performance endpoint...")
    response = client.get('/api/students/STUD001/performance')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.get_json()
        print(f"Student: {data['student_id']}")
        print(f"Risk Level: {data['analysis']['overall_risk_level']}")
        print(f"Modules: {data['summary']['total_modules']}")
        print("✅ Performance endpoint passed!")
    else:
        print("❌ Performance endpoint failed!")
        if response.status_code != 404:
            print(response.data.decode())
    
    print("\n" + "-" * 40)
    
    # Test goals endpoint
    print("Testing goals endpoint...")
    response = client.get('/api/students/STUD001/goals')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.get_json()
        print(f"Goals: {len(data['goals'])}")
        print(f"Completion Rate: {data['completion_stats']['completion_rate']}%")
        print("✅ Goals endpoint passed!")
    else:
        print("❌ Goals endpoint failed!")
    
    print("\n" + "-" * 40)
    
    # Test legacy prediction
    print("Testing legacy prediction...")
    test_data = {
        "Module_Difficulty": 3.0,
        "Current_GPA": 2.5,
        "Avg_Assessment_Score": 65,
        "Assignments_Late": 2,
        "Num_Submission_Attempts": 1,
        "Login_Frequency": 15
    }
    
    response = client.post('/predict', json=test_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.get_json()
        print(f"Prediction: {data['prediction'][0]}")
        print(f"Risk Score: {data['risk_score']}")
        print("✅ Legacy prediction passed!")
    else:
        print("❌ Legacy prediction failed!")
        print(response.data.decode())
    
    print("\n" + "=" * 40)
    print("🎯 Direct Flask App Test Completed!")
