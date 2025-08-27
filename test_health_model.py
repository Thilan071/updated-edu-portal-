#!/usr/bin/env python3
"""
Test script to directly test the health model and see its output structure
"""

import requests
import json

def test_health_model():
    # Test data with the correct structure that the model expects
    test_data = {
        "Module_Difficulty": 3,
        "Current_GPA": 3.5,
        "Avg_Assessment_Score": 85,
        "Assignments_Late": 2,
        "Num_Submission_Attempts": 1,
        "Login_Frequency": 5,
        "mood": "Happy",
        "stress_level": 3,
        "procrastination_level": 2,
        "sleep_hours": 7
    }
    
    print("Testing health model with data:")
    print(json.dumps(test_data, indent=2))
    print("\n" + "="*50)
    
    try:
        # Make request to the Python backend health endpoint
        response = requests.post(
            "http://localhost:5000/api/health/predict",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Response Status Code: {response.status_code}")
        print("\nRaw Response:")
        print(response.text)
        
        if response.status_code == 200:
            data = response.json()
            print("\nParsed JSON Response:")
            print(json.dumps(data, indent=2))
            
            # Check the structure
            print("\n" + "="*50)
            print("RESPONSE STRUCTURE ANALYSIS:")
            print(f"Top-level keys: {list(data.keys())}")
            
            if 'result' in data:
                result = data['result']
                print(f"Result keys: {list(result.keys())}")
                
                # Check for plans
                for plan_type in ['study_plan', 'physical_plan', 'emotional_plan']:
                    if plan_type in result:
                        plan_content = result[plan_type]
                        print(f"\n{plan_type.upper()}:")
                        print(f"Type: {type(plan_content)}")
                        print(f"Content: {repr(plan_content[:200] if isinstance(plan_content, str) else plan_content)}")
                        
                        # Test parsing bullet points
                        if isinstance(plan_content, str):
                            lines = plan_content.split('\n')
                            bullet_lines = [line.strip() for line in lines if line.strip().startswith('•')]
                            print(f"Bullet points found: {len(bullet_lines)}")
                            for i, line in enumerate(bullet_lines[:3]):  # Show first 3
                                print(f"  {i+1}. {line}")
                    else:
                        print(f"\n{plan_type.upper()}: NOT FOUND")
            else:
                print("No 'result' key found in response")
                
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to Python backend at http://localhost:5000")
        print("Make sure the Python server is running with: python app.py")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    test_health_model()