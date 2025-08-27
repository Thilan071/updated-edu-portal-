"""
Client script to test the Flask API server for student risk prediction model.

This script sends a POST request to the running Flask server with sample data
and displays the prediction result.

Requirements:
- requests library
- Flask server running on localhost:5000

Usage:
    python test_client.py
"""

import requests
import json

def test_model_api():
    """
    Send a test request to the Flask API server and display results.
    """
    # Define the API endpoint URL
    url = "http://localhost:5000/predict"
    
    # Define sample test data representing an "at-risk" student profile
    test_data = {
        "Module_Difficulty": [0.50],
        "Current_GPA": [2],
        "Avg_Assessment_Score": [65],
        "Assignments_Late": [2],
        "Num_Submission_Attempts": [1],
        "Login_Frequency": [50]
    }
    
    # Set the Content-Type header for JSON
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("Sending test request to Flask API server...")
        print(f"URL: {url}")
        print(f"Test data: {json.dumps(test_data, indent=2)}")
        print("-" * 50)
        
        # Send POST request to the API
        response = requests.post(url, json=test_data, headers=headers)
        
        # Check the response status code
        if response.status_code == 200:
            print("✅ SUCCESS: Request completed successfully!")
            print(f"Status Code: {response.status_code}")
            print("Response from server:")
            print(json.dumps(response.json(), indent=2))
            
            # Parse and display the prediction
            prediction_result = response.json()
            if "prediction" in prediction_result:
                prediction = prediction_result["prediction"][0]
                risk_level = "HIGH RISK" if prediction == 1 else "LOW RISK"
                print(f"\n🎯 Prediction: {prediction} ({risk_level})")
            
        else:
            print("❌ ERROR: Request failed!")
            print(f"Status Code: {response.status_code}")
            print(f"Response Text: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR: Unable to connect to the Flask server.")
        print("Please make sure the Flask server (app.py) is running on localhost:5000")
        print("To start the server, run: python app.py")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ REQUEST ERROR: An error occurred while making the request: {e}")
        
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("Flask API Client Test Script")
    print("Testing Student Risk Prediction Model")
    print("=" * 60)
    test_model_api()
    print("=" * 60)
