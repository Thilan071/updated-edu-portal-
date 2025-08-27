"""
Enhanced EduBoost Test Client
Test all three main pages and enhanced features of the EduBoost platform
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:5000"

def print_header(title):
    """Print formatted header"""
    print("\n" + "="*60)
    print(f"🎯 {title}")
    print("="*60)

def print_subheader(title):
    """Print formatted subheader"""
    print(f"\n📋 {title}")
    print("-"*40)

def test_health_check():
    """Test system health and get system information"""
    print_header("SYSTEM HEALTH CHECK")
    
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print("✅ System Status:", data['status'])
            print("🏷️  Service:", data['service'])
            print("📦 Version:", data['version'])
            
            print_subheader("Available Features")
            for feature in data['features']:
                print(f"   ✓ {feature}")
            
            print_subheader("API Endpoints")
            for endpoint in data['api_endpoints']:
                print(f"   🔗 {endpoint}")
            
            print_subheader("Database Features")
            for feature in data['database_features']:
                print(f"   🗄️  {feature}")
            
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_page_1_repeat_preparation(student_id="STUD001"):
    """Test Page 1: Repeat Preparation - Performance Analysis & Lecturer Feedback"""
    print_header("PAGE 1: REPEAT PREPARATION")
    
    try:
        # Get comprehensive student performance
        print_subheader("Student Performance Analysis")
        response = requests.get(f"{BASE_URL}/api/students/{student_id}/performance")
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"👤 Student ID: {data['student_id']}")
            print(f"📊 Overall Risk Level: {data['analysis']['overall_risk_level'].upper()}")
            print(f"📈 Overall GPA: {data['summary']['overall_gpa']}")
            print(f"📚 Total Modules: {data['summary']['total_modules']}")
            
            # Module breakdown
            print_subheader("Module Performance Breakdown")
            print(f"❌ Failing Modules: {data['summary']['failing_modules']}")
            print(f"⚠️  At-Risk Modules: {data['summary']['at_risk_modules']}")
            print(f"✅ Strong Modules: {data['summary']['strong_modules']}")
            
            if data['analysis']['failing_modules']:
                print("\n🚨 FAILING MODULES DETAILS:")
                for module in data['analysis']['failing_modules']:
                    print(f"   📖 {module['module']}")
                    print(f"      Grade: {module['current_grade']}%")
                    print(f"      Attendance: {module['attendance']}%")
                    print(f"      Risk Factors: {', '.join(module['risk_factors'])}")
            
            if data['analysis']['improvement_suggestions']:
                print_subheader("AI Improvement Suggestions")
                for suggestion in data['analysis']['improvement_suggestions']:
                    print(f"   🎯 Area: {suggestion['area']}")
                    print(f"      Action: {suggestion['action']}")
                    print(f"      Timeline: {suggestion['timeline']}")
                    if 'resources' in suggestion:
                        print(f"      Resources: {', '.join(suggestion['resources'])}")
                    print()
            
            # Display lecturer feedback
            if data['lecturer_feedback']:
                print_subheader("Lecturer Feedback")
                for feedback in data['lecturer_feedback']:
                    print(f"   👨‍🏫 Module: {feedback['module_name']}")
                    print(f"      Lecturer: {feedback['lecturer_id']}")
                    print(f"      Urgency: {feedback['urgency_level']}/5")
                    print(f"      Timeline: {feedback['improvement_timeline']}")
                    print(f"      Feedback: {feedback['feedback_text']}")
                    
                    weak_areas = json.loads(feedback['weak_areas']) if isinstance(feedback['weak_areas'], str) else feedback['weak_areas']
                    if weak_areas:
                        print(f"      Weak Areas: {', '.join(weak_areas)}")
                    print()
            
            return True
        else:
            print(f"❌ Failed to get performance data: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_page_2_my_goals(student_id="STUD001"):
    """Test Page 2: My Goals - AI-Generated Personalized Goals"""
    print_header("PAGE 2: MY GOALS")
    
    try:
        # Get AI-generated goals
        print_subheader("AI-Generated Personalized Goals")
        response = requests.get(f"{BASE_URL}/api/students/{student_id}/goals")
        
        if response.status_code == 200:
            data = response.json()
            
            # Display completion statistics
            stats = data['completion_stats']
            print(f"📊 Goal Statistics:")
            print(f"   Total Goals: {stats['total_goals']}")
            print(f"   Completed: {stats['completed_goals']}")
            print(f"   In Progress: {stats['in_progress_goals']}")
            print(f"   Completion Rate: {stats['completion_rate']}%")
            print(f"   High Priority: {stats['high_priority_goals']}")
            print(f"   Medium Priority: {stats['medium_priority_goals']}")
            print(f"   Low Priority: {stats['low_priority_goals']}")
            
            # Display individual goals
            print_subheader("Individual Goals Details")
            for i, goal in enumerate(data['goals'], 1):
                print(f"\n🎯 Goal {i}: {goal['goal_title']}")
                print(f"   📖 Module: {goal['module_name']}")
                print(f"   📝 Description: {goal['goal_description']}")
                print(f"   🔥 Priority: {goal['priority_level'].upper()}")
                print(f"   📅 Target Date: {goal['target_completion_date']}")
                print(f"   ⏰ Days Remaining: {goal['days_remaining']}")
                print(f"   📈 Progress: {goal['current_progress']}%")
                print(f"   🎓 Type: {goal['goal_type']}")
                
                if goal['success_criteria']:
                    print(f"   ✅ Success Criteria:")
                    for criteria in goal['success_criteria']:
                        print(f"      • {criteria}")
            
            # Display recommendations
            recommendations = data['recommendations']
            print_subheader("Study Recommendations")
            print(f"🎯 Focus Areas: {', '.join(recommendations['focus_areas'])}")
            print(f"⏰ Suggested Daily Study: {recommendations['suggested_daily_study_hours']} hours")
            print(f"📅 Estimated Completion: {recommendations['estimated_completion_weeks']} weeks")
            
            return True
        else:
            print(f"❌ Failed to get goals: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_page_3_personalized_planner(student_id="STUD001"):
    """Test Page 3: Personalized Planner - Resources & Study Plans"""
    print_header("PAGE 3: PERSONALIZED PLANNER")
    
    try:
        # Get personalized study planner
        print_subheader("Personalized Study Plan")
        response = requests.get(f"{BASE_URL}/api/students/{student_id}/planner")
        
        if response.status_code == 200:
            data = response.json()
            
            # Study plan overview
            study_plan = data['study_plan']
            print(f"📚 Recommended Weekly Hours: {study_plan['recommended_hours']}")
            print(f"🎯 Focus Modules: {', '.join(study_plan['focus_modules'])}")
            
            # Weekly schedule
            print_subheader("Weekly Study Schedule")
            for day, schedule in study_plan['weekly_schedule'].items():
                print(f"   {day}: {schedule['time']} - {schedule['subject']} ({schedule['duration']})")
            
            # Study techniques
            print_subheader("Recommended Study Techniques")
            for technique in study_plan['study_techniques']:
                print(f"   💡 {technique}")
            
            # Wellness plans
            print_subheader("Wellness Plans")
            print(f"🏃‍♂️ Physical Plan: {study_plan['physical_plan']}")
            print(f"🧠 Emotional Plan: {study_plan['emotional_plan']}")
            
            # Mini goals
            print_subheader("Mini Goals")
            for mini_goal in study_plan['mini_goals']:
                status = "✅" if mini_goal['completed'] else "⏳"
                print(f"   {status} {mini_goal['title']} ({mini_goal['module']})")
            
            # Book recommendations
            if data['book_recommendations']:
                print_subheader("Book Recommendations")
                for book in data['book_recommendations']:
                    print(f"   📚 {book['resource_title']}")
                    print(f"      Author: {book['resource_author']}")
                    print(f"      Module: {book['module_name']}")
                    print(f"      Difficulty: {book['difficulty_level']}/5")
                    print(f"      Rating: {book['rating']}/5")
                    print(f"      Hours: {book['estimated_hours']}h")
                    print(f"      Free: {'Yes' if book['is_free'] else 'No'}")
                    print(f"      URL: {book['resource_url']}")
                    print()
            
            # Online resources
            if data['online_resources']:
                print_subheader("Online Learning Resources")
                for resource in data['online_resources']:
                    print(f"   🌐 {resource['resource_title']}")
                    print(f"      Module: {resource['module_name']}")
                    print(f"      Type: {resource['resource_type']}")
                    print(f"      Duration: {resource['estimated_hours']}h")
                    print(f"      Rating: {resource['rating']}/5")
                    print(f"      URL: {resource['resource_url']}")
                    print()
            
            # Practice platforms
            if data['practice_platforms']:
                print_subheader("Practice Platforms")
                for platform in data['practice_platforms']:
                    print(f"   💻 {platform['resource_title']}")
                    print(f"      Module: {platform['module_name']}")
                    print(f"      URL: {platform['resource_url']}")
                    print()
            
            # Personalization factors
            factors = data['personalization_factors']
            print_subheader("Personalization Analysis")
            print(f"Risk Level: {factors['risk_level']}")
            print(f"Weak Modules: {factors['weak_module_count']}")
            print(f"Study Intensity: {factors['study_intensity']}")
            
            return True
        else:
            print(f"❌ Failed to get planner: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_lecturer_feedback_submission():
    """Test lecturer feedback submission"""
    print_header("LECTURER FEEDBACK SUBMISSION")
    
    feedback_data = {
        "student_id": "STUD001",
        "module_name": "Database Management",
        "lecturer_id": "prof_smith",
        "feedback_text": "Student shows good understanding of basic concepts but struggles with complex SQL queries and joins. Needs more practice with normalization.",
        "weak_areas": ["Complex SQL Queries", "JOIN Operations", "Database Normalization"],
        "strength_areas": ["Basic SQL", "ER Diagrams", "Database Concepts"],
        "recommended_actions": ["Practice SQL JOINs daily", "Complete W3Schools advanced SQL", "Work on normalization exercises"],
        "urgency_level": 4,
        "improvement_timeline": "2 weeks"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/lecturer/feedback", json=feedback_data)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Feedback submitted successfully!")
            print(f"📝 Feedback ID: {data['feedback_id']}")
            print(f"📊 Status: {data['status']}")
            
            print_subheader("Next Steps")
            for step in data['next_steps']:
                print(f"   ▶️  {step}")
            
            return True
        else:
            print(f"❌ Failed to submit feedback: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_modules_list():
    """Test modules list endpoint"""
    print_header("AVAILABLE MODULES")
    
    try:
        response = requests.get(f"{BASE_URL}/api/modules")
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"📚 Total Modules: {data['total_modules']}")
            
            print_subheader("All Modules")
            for module in data['modules']:
                print(f"   📖 {module['module_code']}: {module['module_name']}")
                print(f"      Description: {module['description']}")
                print()
            
            print_subheader("Module Categories")
            for category, modules in data['categories'].items():
                print(f"   🏷️  {category.title()}: {', '.join(modules)}")
            
            return True
        else:
            print(f"❌ Failed to get modules: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_legacy_prediction():
    """Test legacy ML prediction endpoint"""
    print_header("LEGACY ML PREDICTION")
    
    test_data = {
        "Module_Difficulty": 3.5,
        "Current_GPA": 2.1,
        "Avg_Assessment_Score": 45,
        "Assignments_Late": 4,
        "Num_Submission_Attempts": 3,
        "Login_Frequency": 8
    }
    
    try:
        response = requests.post(f"{BASE_URL}/predict", json=test_data)
        
        if response.status_code == 200:
            data = response.json()
            
            print("✅ Prediction completed!")
            print(f"🔮 Prediction: {data['prediction'][0]} ({'High Risk' if data['prediction'][0] == 1 else 'Low Risk'})")
            print(f"📊 Risk Score: {data['risk_score']}")
            print(f"🎯 Confidence: {data['confidence']}")
            print(f"⚠️  Risk Level: {data['risk_level']}")
            
            print_subheader("Factors Analysis")
            factors = data['factors_analysis']
            print(f"   📚 Academic Risk: {factors['academic_risk']}")
            print(f"   👤 Behavioral Risk: {factors['behavioral_risk']}")
            print(f"   💻 Engagement Risk: {factors['engagement_risk']}")
            
            print_subheader("Quick Recommendations")
            for recommendation in data['recommendations']:
                print(f"   💡 {recommendation}")
            
            return True
        else:
            print(f"❌ Prediction failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def run_comprehensive_test():
    """Run comprehensive test of all EduBoost features"""
    print("🚀 STARTING COMPREHENSIVE EDUBOOST TEST")
    print("="*60)
    print(f"⏰ Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    test_results = {
        'health_check': False,
        'page_1_repeat_preparation': False,
        'page_2_my_goals': False,
        'page_3_personalized_planner': False,
        'lecturer_feedback': False,
        'modules_list': False,
        'legacy_prediction': False
    }
    
    # Run all tests
    test_results['health_check'] = test_health_check()
    time.sleep(1)
    
    test_results['page_1_repeat_preparation'] = test_page_1_repeat_preparation()
    time.sleep(1)
    
    test_results['page_2_my_goals'] = test_page_2_my_goals()
    time.sleep(1)
    
    test_results['page_3_personalized_planner'] = test_page_3_personalized_planner()
    time.sleep(1)
    
    test_results['lecturer_feedback'] = test_lecturer_feedback_submission()
    time.sleep(1)
    
    test_results['modules_list'] = test_modules_list()
    time.sleep(1)
    
    test_results['legacy_prediction'] = test_legacy_prediction()
    
    # Display final results
    print_header("COMPREHENSIVE TEST RESULTS")
    
    passed_tests = sum(test_results.values())
    total_tests = len(test_results)
    
    print(f"📊 Overall Results: {passed_tests}/{total_tests} tests passed")
    print(f"✅ Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    print_subheader("Individual Test Results")
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} {test_name.replace('_', ' ').title()}")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL TESTS PASSED! EduBoost platform is fully functional!")
    else:
        print(f"\n⚠️  {total_tests - passed_tests} test(s) failed. Check server status.")
    
    print(f"\n⏰ Test Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    print("🧪 Enhanced EduBoost Platform Test Client")
    print("Testing all three main pages and enhanced features...")
    print()
    
    # Wait a moment for server to be ready
    print("⏳ Waiting for server to be ready...")
    time.sleep(2)
    
    # Run comprehensive test
    run_comprehensive_test()
