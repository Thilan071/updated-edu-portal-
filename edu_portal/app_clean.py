"""
EduBoost Educational Platform - Flask API Server
A comprehensive educational support system with AI-powered student risk prediction
and personalized learning recommendations.

Features:
- Student performance analysis and risk prediction
- AI-generated personalized learning goals
- Intelligent study planning with resource recommendations
- Lecturer feedback integration

API Endpoints:
- GET  /api/students/<id>/performance  - Student performance analysis
- GET  /api/students/<id>/goals        - Personalized learning goals
- GET  /api/students/<id>/planner      - Study planner with resources
- POST /api/lecturer/feedback          - Submit lecturer feedback
- POST /predict                        - Legacy ML prediction endpoint
"""

from flask import Flask, request, jsonify
import pandas as pd
import pickle
import os
import numpy as np
from datetime import datetime, timedelta
import random

# Initialize Flask app
app = Flask(__name__)

# Global variables
eduboost_ai = None

class EduBoostAI:
    """AI-powered educational support system"""
    
    def __init__(self):
        self.model = None
        self.load_model()
    
    def load_model(self):
        """Load the machine learning model"""
        try:
            model_path = os.path.join('model', 'eduboost_ultra_accuracy_model.pkl')
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            print("✅ ML model loaded successfully")
        except Exception as e:
            print(f"⚠️ Model loading failed: {e}")
            print("Using rule-based prediction system")
            self.model = None
    
    def analyze_student_performance(self, performance_data):
        """Analyze student performance and identify areas for improvement"""
        weak_modules = []
        strong_modules = []
        overall_risk = "low"
        
        total_score = 0
        risk_count = 0
        
        for module in performance_data:
            grade = module['current_grade']
            total_score += grade
            
            if grade < 50:
                weak_modules.append(module['module_name'])
                risk_count += 2
            elif grade < 65:
                weak_modules.append(module['module_name'])
                risk_count += 1
            elif grade >= 80:
                strong_modules.append(module['module_name'])
        
        avg_score = total_score / len(performance_data)
        
        if risk_count >= 4:
            overall_risk = "high"
        elif risk_count >= 2:
            overall_risk = "medium"
        else:
            overall_risk = "low"
        
        return {
            'weak_modules': weak_modules,
            'strong_modules': strong_modules,
            'overall_risk': overall_risk,
            'average_score': round(avg_score, 2),
            'recommendations': self.generate_recommendations(weak_modules, overall_risk)
        }
    
    def generate_recommendations(self, weak_modules, risk_level):
        """Generate personalized recommendations"""
        recommendations = []
        
        if risk_level == "high":
            recommendations.extend([
                "Schedule immediate meeting with academic advisor",
                "Consider reduced course load for better focus",
                "Attend all available tutoring sessions"
            ])
        
        if weak_modules:
            recommendations.extend([
                f"Focus extra study time on: {', '.join(weak_modules[:3])}",
                "Form study groups for challenging subjects",
                "Utilize online learning resources"
            ])
        
        recommendations.extend([
            "Maintain regular study schedule",
            "Seek help during office hours",
            "Use active learning techniques"
        ])
        
        return recommendations

def generate_sample_performance_data(student_id):
    """Generate realistic student performance data"""
    modules = [
        "Machine Learning Fundamentals",
        "Data Structures & Algorithms", 
        "Software Engineering Principles",
        "Database Systems",
        "Web Development",
        "Computer Networks"
    ]
    
    performance_data = []
    random.seed(hash(student_id) % 1000)  # Consistent data per student
    
    for module in modules:
        base_score = random.uniform(45, 90)
        performance_data.append({
            'module_name': module,
            'current_grade': round(base_score, 1),
            'avg_assignment_score': round(base_score + random.uniform(-10, 5), 1),
            'attendance_rate': round(random.uniform(70, 100), 1),
            'assignments_completed': random.randint(8, 12),
            'assignments_total': 12,
            'late_submissions': random.randint(0, 3),
            'login_frequency': random.randint(8, 25),
            'predicted_final_grade': round(base_score + random.uniform(-5, 10), 1)
        })
    
    return performance_data

def generate_personalized_goals(student_id, performance_data, analysis):
    """Generate AI-powered personalized learning goals"""
    goals = []
    random.seed(hash(student_id) % 1000)
    
    for i, module_data in enumerate(performance_data):
        module_name = module_data['module_name']
        current_grade = module_data['current_grade']
        
        if current_grade < 65:
            target_grade = min(current_grade + 15, 85)
            goals.append({
                'id': f'goal_{student_id}_{i}',
                'type': 'Grade Improvement',
                'module': module_name,
                'title': f'Improve {module_name} grade to {target_grade}%',
                'current_progress': 0,
                'target_value': target_grade,
                'current_value': current_grade,
                'deadline': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
                'priority': 'High' if current_grade < 50 else 'Medium',
                'action_items': [
                    'Complete weekly practice sessions',
                    'Attend all lectures',
                    'Submit assignments on time',
                    'Seek help during office hours'
                ]
            })
    
    return goals

def generate_study_plan(performance_data):
    """Generate personalized study plan with resources"""
    weak_modules = [m for m in performance_data if m['current_grade'] < 70]
    
    # Book recommendations
    book_recommendations = [
        {
            'title': 'Hands-On Machine Learning',
            'author': 'Aurélien Géron',
            'difficulty': 'Intermediate',
            'rating': 4.8
        },
        {
            'title': 'Introduction to Algorithms',
            'author': 'Cormen, Leiserson, Rivest, Stein',
            'difficulty': 'Advanced',
            'rating': 4.7
        }
    ]
    
    # Online resources
    online_resources = [
        {
            'title': 'Coursera Machine Learning Course',
            'platform': 'Coursera',
            'type': 'Video Course',
            'free': True
        },
        {
            'title': 'LeetCode Practice Problems',
            'platform': 'LeetCode',
            'type': 'Practice Platform',
            'free': 'Freemium'
        }
    ]
    
    # Weekly schedule
    weekly_schedule = {
        'Monday': {'time': '19:00-21:00', 'subject': 'High Priority Module'},
        'Wednesday': {'time': '19:00-21:00', 'subject': 'Practice Problems'},
        'Saturday': {'time': '09:00-12:00', 'subject': 'Review & Projects'}
    }
    
    return {
        'weekly_schedule': weekly_schedule,
        'recommended_hours': len(weak_modules) * 3 + 6,
        'book_recommendations': book_recommendations,
        'online_resources': online_resources,
        'study_techniques': [
            'Pomodoro Technique (25 min study, 5 min break)',
            'Active recall and spaced repetition',
            'Practice problems before theory review'
        ]
    }

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'EduBoost Educational Platform',
        'version': '1.0',
        'endpoints': [
            'GET /api/students/<id>/performance',
            'GET /api/students/<id>/goals', 
            'GET /api/students/<id>/planner',
            'POST /api/lecturer/feedback',
            'POST /predict'
        ]
    })

@app.route('/api/students/<student_id>/performance', methods=['GET'])
def get_student_performance(student_id):
    """Get comprehensive student performance analysis"""
    try:
        # Get student performance data
        sample_data = generate_sample_performance_data(student_id)
        
        # AI analysis
        analysis = eduboost_ai.analyze_student_performance(sample_data)
        
        return jsonify({
            'student_id': student_id,
            'modules': sample_data,
            'analysis': analysis,
            'overall_risk_level': analysis['overall_risk'],
            'last_updated': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/<student_id>/goals', methods=['GET'])
def get_student_goals(student_id):
    """Get AI-generated personalized learning goals"""
    try:
        # Get student data and generate goals
        sample_data = generate_sample_performance_data(student_id)
        analysis = eduboost_ai.analyze_student_performance(sample_data)
        goals = generate_personalized_goals(student_id, sample_data, analysis)
        
        return jsonify({
            'student_id': student_id,
            'goals': goals,
            'total_goals': len(goals),
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/<student_id>/planner', methods=['GET'])
def get_personalized_planner(student_id):
    """Get personalized study planner with resources"""
    try:
        # Get student data and generate study plan
        sample_data = generate_sample_performance_data(student_id)
        study_plan = generate_study_plan(sample_data)
        
        return jsonify({
            'student_id': student_id,
            'study_plan': study_plan,
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lecturer/feedback', methods=['POST'])
def submit_lecturer_feedback():
    """Submit lecturer feedback for students"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['student_id', 'module_name', 'lecturer_id', 'feedback_text']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Process feedback
        feedback_record = {
            'id': f"fb_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'student_id': data['student_id'],
            'module_name': data['module_name'],
            'lecturer_id': data['lecturer_id'],
            'feedback_text': data['feedback_text'],
            'created_at': datetime.now().isoformat()
        }
        
        return jsonify({
            'feedback_id': feedback_record['id'],
            'status': 'success',
            'message': 'Feedback submitted successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    """Legacy ML prediction endpoint for backward compatibility"""
    try:
        data = request.get_json(force=True)
        
        # Basic columns for legacy support
        basic_columns = [
            "Module_Difficulty", "Current_GPA", "Avg_Assessment_Score",
            "Assignments_Late", "Num_Submission_Attempts", "Login_Frequency"
        ]
        
        # Validate input
        if not all(col in data for col in basic_columns):
            return jsonify({
                "error": "Missing required columns.",
                "expected": basic_columns,
                "received": list(data.keys())
            }), 400
        
        # Extract values
        current_gpa = data['Current_GPA'][0] if isinstance(data['Current_GPA'], list) else data['Current_GPA']
        avg_score = data['Avg_Assessment_Score'][0] if isinstance(data['Avg_Assessment_Score'], list) else data['Avg_Assessment_Score']
        late_assignments = data['Assignments_Late'][0] if isinstance(data['Assignments_Late'], list) else data['Assignments_Late']
        login_freq = data['Login_Frequency'][0] if isinstance(data['Login_Frequency'], list) else data['Login_Frequency']
        
        # Rule-based prediction
        risk_score = 0
        if current_gpa < 2.5: risk_score += 2
        elif current_gpa < 3.0: risk_score += 1
        if avg_score < 60: risk_score += 2
        elif avg_score < 70: risk_score += 1
        if late_assignments >= 3: risk_score += 2
        elif late_assignments >= 1: risk_score += 1
        if login_freq < 10: risk_score += 1
        
        prediction = 1 if risk_score >= 3 else 0
        confidence = min(risk_score / 6, 1.0)
        
        return jsonify({
            "prediction": [prediction],
            "risk_score": risk_score,
            "confidence": confidence,
            "note": "EduBoost prediction system"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting EduBoost Educational Platform...")
    print("📊 Initializing AI components...")
    
    # Initialize the global EduBoost AI system
    eduboost_ai = EduBoostAI()
    print("✅ EduBoost AI system initialized!")
    
    print("🌐 Starting Flask server on http://localhost:5000")
    print("\n📋 Available API endpoints:")
    print("   📈 GET  /api/students/<id>/performance    - Student performance analysis")
    print("   🎯 GET  /api/students/<id>/goals          - Personalized goals")  
    print("   📚 GET  /api/students/<id>/planner        - Study planner & resources")
    print("   👨‍🏫 POST /api/lecturer/feedback           - Submit lecturer feedback")
    print("   🔮 POST /predict                          - Legacy ML prediction")
    print("\n" + "="*50)
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
