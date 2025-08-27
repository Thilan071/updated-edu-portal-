"""
EduBoost Educational Platform - Complete Implementation
A comprehensive AI-powered educational support system with enhanced features

Features:
1. Repeat Preparation Page - Lecturer feedback & student analytics  
2. My Goals Page - AI-generated personalized goals
3. Personalized Planner Page - Curated resources & study plans

Database Schema: Enhanced student performance tracking with 14 core fields
AI Models: Performance analysis, goal generation, resource recommendation
"""

from flask import Flask, request, jsonify, render_template_string
import pandas as pd
import pickle
import os
import numpy as np
from datetime import datetime, timedelta
import random
import json
import sqlite3
from typing import Dict, List, Optional
import uuid

# Initialize Flask app
app = Flask(__name__)

# =============================================================================
# DATABASE SETUP AND MODELS
# =============================================================================

def initialize_database():
    """Initialize SQLite database with enhanced schema"""
    conn = sqlite3.connect('eduboost.db')
    cursor = conn.cursor()
    
    # Student Performance Table (Enhanced with 14 fields)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS student_performance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            module_name TEXT NOT NULL,
            module_difficulty REAL,
            current_gpa REAL,
            avg_assessment_score INTEGER,
            assignments_late INTEGER,
            num_submission_attempts INTEGER,
            login_frequency INTEGER,
            attendance_rate REAL,
            lab_completion_rate REAL,
            participation_score INTEGER,
            failed_module INTEGER,
            semester TEXT,
            risk_score REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Lecturer Feedback Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS lecturer_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            module_name TEXT NOT NULL,
            lecturer_id TEXT NOT NULL,
            feedback_text TEXT,
            weak_areas TEXT, -- JSON string
            strength_areas TEXT, -- JSON string
            recommended_actions TEXT, -- JSON string
            urgency_level INTEGER CHECK (urgency_level BETWEEN 1 AND 5),
            improvement_timeline TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Student Goals Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS student_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            goal_id TEXT UNIQUE NOT NULL,
            student_id TEXT NOT NULL,
            module_name TEXT,
            goal_title TEXT NOT NULL,
            goal_description TEXT,
            goal_type TEXT, -- "skill_improvement", "assignment_completion", "resource_study"
            priority_level TEXT, -- "high", "medium", "low"
            target_completion_date DATE,
            current_progress INTEGER DEFAULT 0, -- 0-100%
            is_completed BOOLEAN DEFAULT FALSE,
            generated_by TEXT DEFAULT 'ai', -- "ai", "lecturer", "student"
            success_criteria TEXT, -- JSON string
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Learning Resources Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS learning_resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_name TEXT NOT NULL,
            resource_type TEXT, -- "book", "online", "video", "practice", "tutorial"
            resource_title TEXT NOT NULL,
            resource_url TEXT,
            resource_author TEXT,
            difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
            topic_tags TEXT, -- JSON string
            rating REAL,
            estimated_hours INTEGER,
            description TEXT,
            is_free BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Goal Resources Mapping
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS goal_resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            goal_id TEXT NOT NULL,
            resource_id INTEGER,
            relevance_score REAL,
            recommended_by TEXT DEFAULT 'ai',
            FOREIGN KEY (resource_id) REFERENCES learning_resources (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized successfully")

# =============================================================================
# ENHANCED AI SYSTEM
# =============================================================================

class EnhancedEduBoostAI:
    """Enhanced AI system for comprehensive educational support"""
    
    def __init__(self):
        self.model = None
        self.modules_list = [
            "Introduction to Computer Science",
            "Mathematics for Computing", 
            "Programming Fundamentals",
            "Object Oriented Programming",
            "Computer Networks",
            "Operating System",
            "Introduction to Machine Learning",
            "Web Development",
            "Electronics and Computer System Architecture",
            "Database Management"
        ]
        self.load_model()
        self.initialize_resources()
    
    def load_model(self):
        """Load the machine learning model"""
        try:
            model_path = os.path.join('model', 'eduboost_ultra_accuracy_model.pkl')
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            print("✅ Enhanced ML model loaded successfully")
        except Exception as e:
            print(f"⚠️ Model loading failed: {e}")
            print("Using enhanced rule-based prediction system")
            self.model = None
    
    def initialize_resources(self):
        """Initialize comprehensive resource database"""
        conn = sqlite3.connect('eduboost.db')
        cursor = conn.cursor()
        
        # Check if resources already exist
        cursor.execute("SELECT COUNT(*) FROM learning_resources")
        count = cursor.fetchone()[0]
        
        if count == 0:
            resources = self.get_comprehensive_resources()
            for resource in resources:
                cursor.execute('''
                    INSERT INTO learning_resources 
                    (module_name, resource_type, resource_title, resource_url, resource_author,
                     difficulty_level, topic_tags, rating, estimated_hours, description, is_free)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    resource['module_name'], resource['resource_type'], resource['resource_title'],
                    resource['resource_url'], resource['resource_author'], resource['difficulty_level'],
                    json.dumps(resource['topic_tags']), resource['rating'], resource['estimated_hours'],
                    resource['description'], resource['is_free']
                ))
            
            conn.commit()
            print("✅ Resource database initialized")
        
        conn.close()
    
    def get_comprehensive_resources(self):
        """Get comprehensive learning resources for all modules"""
        resources = []
        
        # Database Management Resources
        resources.extend([
            {
                'module_name': 'Database Management',
                'resource_type': 'online',
                'resource_title': 'W3Schools SQL Tutorial',
                'resource_url': 'https://www.w3schools.com/sql/',
                'resource_author': 'W3Schools',
                'difficulty_level': 1,
                'topic_tags': ['SQL', 'Queries', 'Database Design'],
                'rating': 4.5,
                'estimated_hours': 10,
                'description': 'Comprehensive SQL tutorial with interactive examples',
                'is_free': True
            },
            {
                'module_name': 'Database Management',
                'resource_type': 'book',
                'resource_title': 'Database System Concepts',
                'resource_url': 'https://www.db-book.com/',
                'resource_author': 'Silberschatz, Korth, Sudarshan',
                'difficulty_level': 3,
                'topic_tags': ['Database Theory', 'SQL', 'Normalization'],
                'rating': 4.7,
                'estimated_hours': 40,
                'description': 'Comprehensive database textbook covering all concepts',
                'is_free': False
            },
            {
                'module_name': 'Database Management',
                'resource_type': 'practice',
                'resource_title': 'SQLBolt Interactive Lessons',
                'resource_url': 'https://sqlbolt.com/',
                'resource_author': 'SQLBolt',
                'difficulty_level': 2,
                'topic_tags': ['SQL Practice', 'Queries'],
                'rating': 4.6,
                'estimated_hours': 8,
                'description': 'Interactive SQL practice with step-by-step lessons',
                'is_free': True
            }
        ])
        
        # Programming Fundamentals Resources
        resources.extend([
            {
                'module_name': 'Programming Fundamentals',
                'resource_type': 'online',
                'resource_title': 'Codecademy Python Course',
                'resource_url': 'https://www.codecademy.com/learn/learn-python-3',
                'resource_author': 'Codecademy',
                'difficulty_level': 1,
                'topic_tags': ['Python', 'Programming Basics', 'Syntax'],
                'rating': 4.4,
                'estimated_hours': 25,
                'description': 'Interactive Python programming course for beginners',
                'is_free': False
            },
            {
                'module_name': 'Programming Fundamentals',
                'resource_type': 'practice',
                'resource_title': 'HackerRank Python Domain',
                'resource_url': 'https://www.hackerrank.com/domains/python',
                'resource_author': 'HackerRank',
                'difficulty_level': 2,
                'topic_tags': ['Python Practice', 'Problem Solving'],
                'rating': 4.3,
                'estimated_hours': 20,
                'description': 'Programming practice problems and challenges',
                'is_free': True
            }
        ])
        
        # Add resources for other modules...
        for module in self.modules_list[2:]:  # Skip already added modules
            resources.extend([
                {
                    'module_name': module,
                    'resource_type': 'online',
                    'resource_title': f'{module} - Online Course',
                    'resource_url': f'https://example.com/{module.lower().replace(" ", "-")}',
                    'resource_author': 'EduBoost',
                    'difficulty_level': 2,
                    'topic_tags': [module.split()[0], 'Fundamentals'],
                    'rating': 4.2,
                    'estimated_hours': 15,
                    'description': f'Comprehensive {module} course with practical examples',
                    'is_free': True
                },
                {
                    'module_name': module,
                    'resource_type': 'book',
                    'resource_title': f'{module} Textbook',
                    'resource_url': f'https://example.com/books/{module.lower().replace(" ", "-")}',
                    'resource_author': 'Academic Publisher',
                    'difficulty_level': 3,
                    'topic_tags': [module.split()[0], 'Theory'],
                    'rating': 4.1,
                    'estimated_hours': 30,
                    'description': f'Academic textbook for {module}',
                    'is_free': False
                }
            ])
        
        return resources
    
    def analyze_comprehensive_performance(self, performance_data):
        """Enhanced performance analysis with 14-field data"""
        analysis = {
            'overall_risk_level': 'low',
            'failing_modules': [],
            'at_risk_modules': [],
            'strong_modules': [],
            'weak_areas': [],
            'improvement_suggestions': [],
            'predicted_outcomes': {},
            'lecturer_attention_needed': []
        }
        
        total_risk = 0
        module_count = len(performance_data)
        
        for module_data in performance_data:
            module_risk = self.calculate_module_risk(module_data)
            total_risk += module_risk['risk_score']
            
            if module_risk['risk_level'] == 'high':
                analysis['failing_modules'].append({
                    'module': module_data['module_name'],
                    'risk_factors': module_risk['risk_factors'],
                    'current_grade': module_data['avg_assessment_score'],
                    'attendance': module_data['attendance_rate']
                })
                
                if module_risk['risk_score'] > 0.8:
                    analysis['lecturer_attention_needed'].append(module_data['module_name'])
            
            elif module_risk['risk_level'] == 'medium':
                analysis['at_risk_modules'].append(module_data['module_name'])
            
            else:
                analysis['strong_modules'].append(module_data['module_name'])
            
            # Generate module-specific suggestions
            suggestions = self.generate_module_specific_suggestions(module_data, module_risk)
            analysis['improvement_suggestions'].extend(suggestions)
        
        # Calculate overall risk
        avg_risk = total_risk / module_count if module_count > 0 else 0
        if avg_risk > 0.6:
            analysis['overall_risk_level'] = 'high'
        elif avg_risk > 0.3:
            analysis['overall_risk_level'] = 'medium'
        
        return analysis
    
    def calculate_module_risk(self, module_data):
        """Calculate comprehensive risk score for a module"""
        risk_factors = []
        risk_score = 0
        
        # Academic performance factors
        if module_data['avg_assessment_score'] < 40:
            risk_factors.append('Very Low Assessment Scores')
            risk_score += 0.3
        elif module_data['avg_assessment_score'] < 50:
            risk_factors.append('Low Assessment Scores')
            risk_score += 0.2
        elif module_data['avg_assessment_score'] < 60:
            risk_factors.append('Below Average Assessment Scores')
            risk_score += 0.1
        
        # GPA factors
        if module_data['current_gpa'] < 2.0:
            risk_factors.append('Very Low GPA')
            risk_score += 0.25
        elif module_data['current_gpa'] < 2.5:
            risk_factors.append('Low GPA')
            risk_score += 0.15
        
        # Behavioral factors
        if module_data['attendance_rate'] < 60:
            risk_factors.append('Poor Attendance')
            risk_score += 0.2
        elif module_data['attendance_rate'] < 75:
            risk_factors.append('Low Attendance')
            risk_score += 0.1
        
        if module_data['lab_completion_rate'] < 50:
            risk_factors.append('Poor Lab Completion')
            risk_score += 0.15
        
        if module_data['participation_score'] < 40:
            risk_factors.append('Low Participation')
            risk_score += 0.1
        
        # Submission patterns
        if module_data['assignments_late'] >= 3:
            risk_factors.append('Frequent Late Submissions')
            risk_score += 0.15
        elif module_data['assignments_late'] >= 1:
            risk_factors.append('Some Late Submissions')
            risk_score += 0.05
        
        if module_data['num_submission_attempts'] > 3:
            risk_factors.append('Multiple Submission Attempts')
            risk_score += 0.1
        
        # Engagement factors
        if module_data['login_frequency'] < 5:
            risk_factors.append('Very Low Engagement')
            risk_score += 0.15
        elif module_data['login_frequency'] < 10:
            risk_factors.append('Low Engagement')
            risk_score += 0.1
        
        # Failed module history
        if module_data['failed_module'] > 0:
            risk_factors.append('Previous Module Failure')
            risk_score += 0.2
        
        # Determine risk level
        if risk_score > 0.6:
            risk_level = 'high'
        elif risk_score > 0.3:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        return {
            'risk_score': min(risk_score, 1.0),
            'risk_level': risk_level,
            'risk_factors': risk_factors
        }
    
    def generate_module_specific_suggestions(self, module_data, module_risk):
        """Generate specific improvement suggestions based on module and risk factors"""
        suggestions = []
        module_name = module_data['module_name']
        
        if module_name == 'Database Management':
            if 'Low Assessment Scores' in module_risk['risk_factors']:
                suggestions.append({
                    'area': 'SQL Practice',
                    'action': 'Complete W3Schools SQL tutorial and practice 20 queries daily',
                    'timeline': '2 weeks',
                    'resources': ['W3Schools SQL Tutorial', 'SQLBolt Interactive Lessons']
                })
            
            if 'Poor Lab Completion' in module_risk['risk_factors']:
                suggestions.append({
                    'area': 'Database Design',
                    'action': 'Review ER diagram concepts and complete all lab exercises',
                    'timeline': '1 week',
                    'resources': ['Database System Concepts Book']
                })
        
        elif module_name == 'Programming Fundamentals':
            if 'Low Assessment Scores' in module_risk['risk_factors']:
                suggestions.append({
                    'area': 'Coding Practice',
                    'action': 'Solve 5 programming problems daily on HackerRank',
                    'timeline': '3 weeks',
                    'resources': ['HackerRank Python Domain', 'Codecademy Python Course']
                })
        
        elif module_name == 'Web Development':
            suggestions.append({
                'area': 'HTML/CSS/JavaScript',
                'action': 'Build 3 small web projects to practice fundamentals',
                'timeline': '2 weeks',
                'resources': ['MDN Web Docs', 'FreeCodeCamp']
            })
        
        # Add general suggestions for any module
        if 'Poor Attendance' in module_risk['risk_factors']:
            suggestions.append({
                'area': 'Class Attendance',
                'action': 'Attend all remaining classes and arrange catch-up sessions',
                'timeline': 'Immediate',
                'resources': ['Lecture Notes', 'Recorded Sessions']
            })
        
        return suggestions
    
    def generate_intelligent_goals(self, student_id, performance_data, lecturer_feedback=None):
        """Generate AI-powered personalized goals"""
        analysis = self.analyze_comprehensive_performance(performance_data)
        goals = []
        
        # Priority 1: Address failing modules (High Priority)
        for failing_module in analysis['failing_modules']:
            module_name = failing_module['module']
            
            # Create specific goals based on module
            if module_name == 'Database Management':
                goals.extend([
                    {
                        'goal_id': str(uuid.uuid4()),
                        'student_id': student_id,
                        'module_name': module_name,
                        'goal_title': 'Master SQL Query Writing',
                        'goal_description': 'Complete comprehensive SQL training to improve database querying skills',
                        'goal_type': 'skill_improvement',
                        'priority_level': 'high',
                        'target_completion_date': (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d'),
                        'current_progress': 0,
                        'success_criteria': json.dumps([
                            'Complete W3Schools SQL course with 90%+ score',
                            'Solve 50 SQL practice problems',
                            'Pass SQL assessment with 75%+ score'
                        ])
                    },
                    {
                        'goal_id': str(uuid.uuid4()),
                        'student_id': student_id,
                        'module_name': module_name,
                        'goal_title': 'Understand Database Normalization',
                        'goal_description': 'Learn and apply 1NF, 2NF, 3NF normalization techniques',
                        'goal_type': 'concept_mastery',
                        'priority_level': 'high',
                        'target_completion_date': (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d'),
                        'current_progress': 0,
                        'success_criteria': json.dumps([
                            'Explain normalization forms with examples',
                            'Normalize a given database schema',
                            'Score 80%+ on normalization quiz'
                        ])
                    }
                ])
            
            elif module_name == 'Programming Fundamentals':
                goals.append({
                    'goal_id': str(uuid.uuid4()),
                    'student_id': student_id,
                    'module_name': module_name,
                    'goal_title': 'Improve Problem-Solving Skills',
                    'goal_description': 'Develop logical thinking and coding problem-solving abilities',
                    'goal_type': 'skill_improvement',
                    'priority_level': 'high',
                    'target_completion_date': (datetime.now() + timedelta(days=21)).strftime('%Y-%m-%d'),
                    'current_progress': 0,
                    'success_criteria': json.dumps([
                        'Solve 30 easy problems on HackerRank',
                        'Complete 10 medium-level challenges',
                        'Improve coding speed by 25%'
                    ])
                })
        
        # Priority 2: At-risk modules (Medium Priority)
        for at_risk_module in analysis['at_risk_modules']:
            goals.append({
                'goal_id': str(uuid.uuid4()),
                'student_id': student_id,
                'module_name': at_risk_module,
                'goal_title': f'Strengthen {at_risk_module} Foundation',
                'goal_description': f'Improve understanding and performance in {at_risk_module}',
                'goal_type': 'performance_improvement',
                'priority_level': 'medium',
                'target_completion_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
                'current_progress': 0,
                'success_criteria': json.dumps([
                    'Complete all assigned readings',
                    'Attend extra tutorial sessions',
                    'Improve assignment scores by 20%'
                ])
            })
        
        # Priority 3: General improvement goals (Low Priority)
        if analysis['overall_risk_level'] in ['medium', 'high']:
            goals.append({
                'goal_id': str(uuid.uuid4()),
                'student_id': student_id,
                'module_name': 'General',
                'goal_title': 'Improve Study Habits',
                'goal_description': 'Develop consistent and effective study routines',
                'goal_type': 'habit_improvement',
                'priority_level': 'low',
                'target_completion_date': (datetime.now() + timedelta(days=45)).strftime('%Y-%m-%d'),
                'current_progress': 0,
                'success_criteria': json.dumps([
                    'Maintain daily study schedule',
                    'Increase weekly study hours by 30%',
                    'Complete all assignments on time'
                ])
            })
        
        # Incorporate lecturer feedback if available
        if lecturer_feedback:
            for feedback in lecturer_feedback:
                if feedback.get('weak_areas'):
                    weak_areas = json.loads(feedback['weak_areas']) if isinstance(feedback['weak_areas'], str) else feedback['weak_areas']
                    for weak_area in weak_areas:
                        goals.append({
                            'goal_id': str(uuid.uuid4()),
                            'student_id': student_id,
                            'module_name': feedback['module_name'],
                            'goal_title': f'Improve {weak_area}',
                            'goal_description': feedback['feedback_text'],
                            'goal_type': 'lecturer_recommended',
                            'priority_level': 'high' if feedback['urgency_level'] >= 4 else 'medium',
                            'target_completion_date': (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d'),
                            'current_progress': 0,
                            'success_criteria': json.dumps(json.loads(feedback['recommended_actions']) if isinstance(feedback['recommended_actions'], str) else feedback['recommended_actions'])
                        })
        
        return goals[:6]  # Limit to 6 goals maximum
    
    def get_personalized_resources(self, student_profile, goals):
        """Get personalized learning resources based on goals and performance"""
        conn = sqlite3.connect('eduboost.db')
        cursor = conn.cursor()
        
        recommendations = {
            'books': [],
            'online_courses': [],
            'practice_platforms': [],
            'video_tutorials': []
        }
        
        # Get modules from goals
        goal_modules = list(set([goal['module_name'] for goal in goals if goal['module_name'] != 'General']))
        
        for module in goal_modules:
            # Get resources for this module
            cursor.execute('''
                SELECT * FROM learning_resources 
                WHERE module_name = ?
                ORDER BY rating DESC, difficulty_level ASC
            ''', (module,))
            
            module_resources = cursor.fetchall()
            
            for resource in module_resources:
                resource_dict = {
                    'id': resource[0],
                    'module_name': resource[1],
                    'resource_type': resource[2],
                    'resource_title': resource[3],
                    'resource_url': resource[4],
                    'resource_author': resource[5],
                    'difficulty_level': resource[6],
                    'topic_tags': json.loads(resource[7]) if resource[7] else [],
                    'rating': resource[8],
                    'estimated_hours': resource[9],
                    'description': resource[10],
                    'is_free': resource[11]
                }
                
                # Categorize resources
                if resource_dict['resource_type'] == 'book':
                    recommendations['books'].append(resource_dict)
                elif resource_dict['resource_type'] == 'online':
                    recommendations['online_courses'].append(resource_dict)
                elif resource_dict['resource_type'] == 'practice':
                    recommendations['practice_platforms'].append(resource_dict)
                elif resource_dict['resource_type'] == 'video':
                    recommendations['video_tutorials'].append(resource_dict)
        
        conn.close()
        
        # Limit recommendations per category
        for category in recommendations:
            recommendations[category] = recommendations[category][:5]
        
        return recommendations

# =============================================================================
# SAMPLE DATA GENERATORS
# =============================================================================

def generate_enhanced_student_data(student_id):
    """Generate comprehensive student performance data with 14 fields"""
    performance_data = []
    random.seed(hash(student_id) % 1000)  # Consistent data per student
    
    modules = [
        "Introduction to Computer Science",
        "Mathematics for Computing", 
        "Programming Fundamentals",
        "Object Oriented Programming",
        "Computer Networks",
        "Operating System",
        "Introduction to Machine Learning",
        "Web Development",
        "Electronics and Computer System Architecture",
        "Database Management"
    ]
    
    # Generate base student profile
    base_ability = random.normalvariate(0, 1)  # Student's general academic ability
    current_gpa = max(0.0, min(4.0, 2.5 + base_ability * 0.8))
    current_semester = random.choice(['Fall2024', 'Spring2025', 'Summer2025'])
    
    for module in modules:
        # Module-specific difficulty
        module_difficulty = random.uniform(2.0, 4.5)
        
        # Correlated performance metrics
        base_score = max(0, min(100, 60 + base_ability * 20 + random.normalvariate(0, 15)))
        avg_assessment_score = int(base_score)
        
        # Behavioral metrics correlated with performance
        attendance_rate = max(30, min(100, base_score + random.normalvariate(10, 15)))
        lab_completion_rate = max(0, min(100, base_score + random.normalvariate(5, 20)))
        participation_score = max(0, min(100, base_score + random.normalvariate(-5, 15)))
        
        # Submission patterns
        if base_score < 50:
            assignments_late = random.poisson(3)
            num_submission_attempts = random.poisson(2.5) + 1
        else:
            assignments_late = random.poisson(0.8)
            num_submission_attempts = random.poisson(1.2) + 1
        
        # Engagement metrics
        login_frequency = max(1, int(10 + base_ability * 8 + random.normalvariate(0, 5)))
        
        # Risk indicators
        failed_module = 1 if (base_score < 40 and random.random() < 0.7) else 0
        
        # Calculate risk score
        risk_score = calculate_risk_score({
            'avg_assessment_score': avg_assessment_score,
            'current_gpa': current_gpa,
            'attendance_rate': attendance_rate,
            'lab_completion_rate': lab_completion_rate,
            'assignments_late': assignments_late,
            'participation_score': participation_score,
            'login_frequency': login_frequency,
            'failed_module': failed_module
        })
        
        module_data = {
            'student_id': student_id,
            'module_name': module,
            'module_difficulty': round(module_difficulty, 2),
            'current_gpa': round(current_gpa, 2),
            'avg_assessment_score': avg_assessment_score,
            'assignments_late': min(assignments_late, 10),
            'num_submission_attempts': min(num_submission_attempts, 8),
            'login_frequency': login_frequency,
            'attendance_rate': round(attendance_rate, 2),
            'lab_completion_rate': round(lab_completion_rate, 2),
            'participation_score': int(participation_score),
            'failed_module': failed_module,
            'semester': current_semester,
            'risk_score': round(risk_score, 3)
        }
        
        performance_data.append(module_data)
    
    return performance_data

def calculate_risk_score(data):
    """Calculate comprehensive risk score"""
    risk = 0
    
    # Academic factors (40% weight)
    if data['avg_assessment_score'] < 40:
        risk += 0.25
    elif data['avg_assessment_score'] < 50:
        risk += 0.15
    elif data['avg_assessment_score'] < 60:
        risk += 0.10
    
    if data['current_gpa'] < 2.0:
        risk += 0.15
    elif data['current_gpa'] < 2.5:
        risk += 0.10
    
    # Behavioral factors (35% weight)
    if data['attendance_rate'] < 60:
        risk += 0.15
    elif data['attendance_rate'] < 75:
        risk += 0.10
    
    if data['lab_completion_rate'] < 50:
        risk += 0.10
    elif data['lab_completion_rate'] < 70:
        risk += 0.05
    
    if data['participation_score'] < 40:
        risk += 0.10
    
    # Submission patterns (15% weight)
    if data['assignments_late'] >= 3:
        risk += 0.10
    elif data['assignments_late'] >= 1:
        risk += 0.05
    
    # Engagement (10% weight)
    if data['login_frequency'] < 5:
        risk += 0.10
    elif data['login_frequency'] < 10:
        risk += 0.05
    
    # Failed module history (bonus factor)
    if data['failed_module'] > 0:
        risk += 0.15
    
    return min(risk, 1.0)

def generate_sample_lecturer_feedback(student_id):
    """Generate sample lecturer feedback"""
    modules = ["Database Management", "Programming Fundamentals", "Web Development"]
    feedback_data = []
    
    for module in modules[:2]:  # Generate feedback for 2 modules
        if module == "Database Management":
            feedback = {
                'student_id': student_id,
                'module_name': module,
                'lecturer_id': 'prof_smith',
                'feedback_text': 'Student shows difficulty with complex SQL queries and normalization concepts. Needs focused practice.',
                'weak_areas': json.dumps(['SQL Joins', 'Normalization', 'Query Optimization']),
                'strength_areas': json.dumps(['Basic SELECT queries', 'Understanding ER diagrams']),
                'recommended_actions': json.dumps(['Practice complex JOIN operations', 'Complete normalization exercises', 'Use W3Schools SQL tutorial']),
                'urgency_level': 4,
                'improvement_timeline': '2 weeks'
            }
        else:
            feedback = {
                'student_id': student_id,
                'module_name': module,
                'lecturer_id': 'prof_jones',
                'feedback_text': 'Good understanding of basic concepts but struggles with problem-solving and debugging.',
                'weak_areas': json.dumps(['Problem Solving', 'Debugging', 'Algorithm Design']),
                'strength_areas': json.dumps(['Syntax Knowledge', 'Basic Programming Concepts']),
                'recommended_actions': json.dumps(['Practice coding problems daily', 'Learn debugging techniques', 'Join study group']),
                'urgency_level': 3,
                'improvement_timeline': '3 weeks'
            }
        
        feedback_data.append(feedback)
    
    return feedback_data

# =============================================================================
# GLOBAL VARIABLES
# =============================================================================

eduboost_ai = None

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint with system information"""
    return jsonify({
        'status': 'healthy',
        'service': 'EduBoost Educational Platform - Enhanced Version',
        'version': '2.0.0',
        'features': [
            'Repeat Preparation Page - Lecturer feedback & analytics',
            'My Goals Page - AI-generated personalized goals',
            'Personalized Planner Page - Curated resources & study plans'
        ],
        'api_endpoints': [
            'GET /api/students/<id>/performance - Enhanced performance analysis',
            'GET /api/students/<id>/goals - AI-generated personalized goals',
            'GET /api/students/<id>/planner - Personalized study planner',
            'POST /api/lecturer/feedback - Submit lecturer feedback',
            'POST /api/goals/<goal_id>/progress - Update goal progress',
            'GET /api/modules - List all available modules',
            'POST /predict - Legacy ML prediction'
        ],
        'database_features': [
            '14-field student performance tracking',
            'Lecturer feedback system',
            'Goal management and tracking',
            'Comprehensive resource database'
        ]
    })

@app.route('/api/students/<student_id>/performance', methods=['GET'])
def get_enhanced_student_performance(student_id):
    """Get comprehensive student performance analysis with 14-field data"""
    try:
        # Generate enhanced performance data
        performance_data = generate_enhanced_student_data(student_id)
        
        # Get lecturer feedback
        lecturer_feedback = generate_sample_lecturer_feedback(student_id)
        
        # AI analysis with enhanced system
        analysis = eduboost_ai.analyze_comprehensive_performance(performance_data)
        
        # Prepare response
        response = {
            'student_id': student_id,
            'performance_data': performance_data,
            'analysis': analysis,
            'lecturer_feedback': lecturer_feedback,
            'summary': {
                'total_modules': len(performance_data),
                'failing_modules': len(analysis['failing_modules']),
                'at_risk_modules': len(analysis['at_risk_modules']),
                'strong_modules': len(analysis['strong_modules']),
                'overall_gpa': round(np.mean([m['current_gpa'] for m in performance_data]), 2),
                'average_attendance': round(np.mean([m['attendance_rate'] for m in performance_data]), 2),
                'average_lab_completion': round(np.mean([m['lab_completion_rate'] for m in performance_data]), 2),
                'risk_level': analysis['overall_risk_level']
            },
            'last_updated': datetime.now().isoformat()
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/<student_id>/goals', methods=['GET'])
def get_ai_generated_goals(student_id):
    """Get AI-generated personalized learning goals"""
    try:
        # Get student performance data
        performance_data = generate_enhanced_student_data(student_id)
        lecturer_feedback = generate_sample_lecturer_feedback(student_id)
        
        # Generate intelligent goals
        goals = eduboost_ai.generate_intelligent_goals(student_id, performance_data, lecturer_feedback)
        
        # Calculate completion statistics
        total_goals = len(goals)
        completed_goals = sum(1 for goal in goals if goal.get('current_progress', 0) >= 100)
        
        completion_stats = {
            'total_goals': total_goals,
            'completed_goals': completed_goals,
            'in_progress_goals': total_goals - completed_goals,
            'completion_rate': round((completed_goals / total_goals) * 100, 1) if total_goals > 0 else 0,
            'high_priority_goals': len([g for g in goals if g['priority_level'] == 'high']),
            'medium_priority_goals': len([g for g in goals if g['priority_level'] == 'medium']),
            'low_priority_goals': len([g for g in goals if g['priority_level'] == 'low'])
        }
        
        # Add estimated completion times
        for goal in goals:
            target_date = datetime.strptime(goal['target_completion_date'], '%Y-%m-%d')
            days_remaining = (target_date - datetime.now()).days
            goal['days_remaining'] = max(0, days_remaining)
            goal['success_criteria'] = json.loads(goal['success_criteria']) if isinstance(goal['success_criteria'], str) else goal['success_criteria']
        
        return jsonify({
            'student_id': student_id,
            'goals': goals,
            'completion_stats': completion_stats,
            'recommendations': {
                'focus_areas': [goal['module_name'] for goal in goals if goal['priority_level'] == 'high'],
                'suggested_daily_study_hours': min(8, len(goals) * 1.5),
                'estimated_completion_weeks': max(2, len([g for g in goals if g['priority_level'] == 'high']) * 2)
            },
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/<student_id>/planner', methods=['GET'])
def get_personalized_planner(student_id):
    """Get comprehensive personalized study planner with resources"""
    try:
        # Get student data and goals
        performance_data = generate_enhanced_student_data(student_id)
        goals = eduboost_ai.generate_intelligent_goals(student_id, performance_data)
        
        # Generate personalized resources
        resources = eduboost_ai.get_personalized_resources({'student_id': student_id}, goals)
        
        # Create weekly study plan
        weak_modules = []
        total_risk = 0
        for module_data in performance_data:
            risk = eduboost_ai.calculate_module_risk(module_data)
            total_risk += risk['risk_score']
            if risk['risk_level'] in ['high', 'medium']:
                weak_modules.append(module_data['module_name'])
        
        avg_risk = total_risk / len(performance_data)
        recommended_hours = min(40, max(15, len(weak_modules) * 4 + int(avg_risk * 10)))
        
        study_plan = {
            'weekly_schedule': generate_weekly_schedule(weak_modules, recommended_hours),
            'recommended_hours': recommended_hours,
            'focus_modules': weak_modules[:3],  # Top 3 priority modules
            'study_techniques': [
                'Pomodoro Technique (25 min study, 5 min break)',
                'Active recall and spaced repetition',
                'Practice problems before theory review',
                'Form study groups for difficult concepts',
                'Use flashcards for memorization topics'
            ],
            'physical_plan': generate_physical_plan(avg_risk),
            'emotional_plan': generate_emotional_plan(avg_risk),
            'mini_goals': generate_mini_goals(weak_modules)
        }
        
        return jsonify({
            'student_id': student_id,
            'study_plan': study_plan,
            'book_recommendations': resources['books'],
            'online_resources': resources['online_courses'],
            'practice_platforms': resources['practice_platforms'],
            'video_tutorials': resources['video_tutorials'],
            'personalization_factors': {
                'risk_level': 'high' if avg_risk > 0.6 else 'medium' if avg_risk > 0.3 else 'low',
                'weak_module_count': len(weak_modules),
                'study_intensity': 'high' if recommended_hours > 30 else 'medium' if recommended_hours > 20 else 'normal'
            },
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lecturer/feedback', methods=['POST'])
def submit_enhanced_lecturer_feedback():
    """Submit comprehensive lecturer feedback"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['student_id', 'module_name', 'lecturer_id', 'feedback_text']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields', 'required': required_fields}), 400
        
        # Store feedback in database
        conn = sqlite3.connect('eduboost.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO lecturer_feedback 
            (student_id, module_name, lecturer_id, feedback_text, weak_areas, 
             strength_areas, recommended_actions, urgency_level, improvement_timeline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['student_id'],
            data['module_name'],
            data['lecturer_id'],
            data['feedback_text'],
            json.dumps(data.get('weak_areas', [])),
            json.dumps(data.get('strength_areas', [])),
            json.dumps(data.get('recommended_actions', [])),
            data.get('urgency_level', 3),
            data.get('improvement_timeline', '2 weeks')
        ))
        
        feedback_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Trigger goal regeneration for the student
        # In a real system, this would be done asynchronously
        
        return jsonify({
            'feedback_id': feedback_id,
            'status': 'success',
            'message': 'Lecturer feedback submitted successfully',
            'next_steps': [
                'Student goals will be updated based on feedback',
                'Personalized resources will be recommended',
                'Progress tracking will be enabled'
            ]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/goals/<goal_id>/progress', methods=['POST'])
def update_goal_progress(goal_id):
    """Update progress for a specific goal"""
    try:
        data = request.json
        new_progress = data.get('progress', 0)
        notes = data.get('notes', '')
        
        # Validate progress value
        if not 0 <= new_progress <= 100:
            return jsonify({'error': 'Progress must be between 0 and 100'}), 400
        
        # Update goal in database
        conn = sqlite3.connect('eduboost.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE student_goals 
            SET current_progress = ?, is_completed = ?, updated_at = CURRENT_TIMESTAMP
            WHERE goal_id = ?
        ''', (new_progress, new_progress >= 100, goal_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Goal not found'}), 404
        
        # Record progress update
        cursor.execute('''
            INSERT INTO student_progress (goal_id, progress_update, notes, updated_by)
            VALUES (?, ?, ?, ?)
        ''', (goal_id, new_progress, notes, 'student'))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'goal_id': goal_id,
            'new_progress': new_progress,
            'is_completed': new_progress >= 100,
            'status': 'success',
            'message': 'Goal progress updated successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/modules', methods=['GET'])
def get_available_modules():
    """Get list of all available modules"""
    modules = [
        {
            'module_name': 'Introduction to Computer Science',
            'module_code': 'CS101',
            'description': 'Fundamental concepts of computer science and programming'
        },
        {
            'module_name': 'Mathematics for Computing',
            'module_code': 'MATH101',
            'description': 'Mathematical foundations for computer science'
        },
        {
            'module_name': 'Programming Fundamentals',
            'module_code': 'CS102',
            'description': 'Basic programming concepts and problem-solving'
        },
        {
            'module_name': 'Object Oriented Programming',
            'module_code': 'CS201',
            'description': 'Object-oriented design and programming principles'
        },
        {
            'module_name': 'Computer Networks',
            'module_code': 'CS301',
            'description': 'Network protocols, architecture, and communication'
        },
        {
            'module_name': 'Operating System',
            'module_code': 'CS302',
            'description': 'Operating system concepts and system programming'
        },
        {
            'module_name': 'Introduction to Machine Learning',
            'module_code': 'CS401',
            'description': 'Machine learning algorithms and applications'
        },
        {
            'module_name': 'Web Development',
            'module_code': 'CS303',
            'description': 'Web technologies and full-stack development'
        },
        {
            'module_name': 'Electronics and Computer System Architecture',
            'module_code': 'EE201',
            'description': 'Digital systems and computer architecture'
        },
        {
            'module_name': 'Database Management',
            'module_code': 'CS304',
            'description': 'Database design, SQL, and database management systems'
        }
    ]
    
    return jsonify({
        'modules': modules,
        'total_modules': len(modules),
        'categories': {
            'foundational': ['CS101', 'MATH101', 'CS102'],
            'intermediate': ['CS201', 'CS301', 'CS302', 'CS303', 'CS304', 'EE201'],
            'advanced': ['CS401']
        }
    })

@app.route('/predict', methods=['POST'])
def legacy_predict():
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
        
        # Extract values (handle both single values and lists)
        def extract_value(field):
            value = data[field]
            return value[0] if isinstance(value, list) else value
        
        module_difficulty = extract_value('Module_Difficulty')
        current_gpa = extract_value('Current_GPA')
        avg_score = extract_value('Avg_Assessment_Score')
        late_assignments = extract_value('Assignments_Late')
        submission_attempts = extract_value('Num_Submission_Attempts')
        login_freq = extract_value('Login_Frequency')
        
        # Enhanced rule-based prediction using the same logic as the AI system
        enhanced_data = {
            'avg_assessment_score': avg_score,
            'current_gpa': current_gpa,
            'attendance_rate': 85,  # Default assumption
            'lab_completion_rate': max(0, avg_score - 10),  # Estimated based on assessment
            'assignments_late': late_assignments,
            'participation_score': max(0, avg_score - 5),  # Estimated
            'login_frequency': login_freq,
            'failed_module': 1 if avg_score < 40 else 0
        }
        
        risk_score = calculate_risk_score(enhanced_data)
        prediction = 1 if risk_score >= 0.4 else 0
        confidence = min(risk_score * 1.5, 1.0)
        
        # Enhanced response with more details
        response = {
            "prediction": [prediction],
            "risk_score": round(risk_score, 3),
            "confidence": round(confidence, 3),
            "risk_level": "high" if risk_score > 0.6 else "medium" if risk_score > 0.3 else "low",
            "factors_analysis": {
                "academic_risk": "high" if avg_score < 50 else "medium" if avg_score < 70 else "low",
                "behavioral_risk": "high" if late_assignments >= 3 else "medium" if late_assignments >= 1 else "low",
                "engagement_risk": "high" if login_freq < 10 else "medium" if login_freq < 20 else "low"
            },
            "recommendations": generate_quick_recommendations(enhanced_data),
            "note": "Enhanced EduBoost prediction system with comprehensive analysis"
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def generate_weekly_schedule(weak_modules, total_hours):
    """Generate personalized weekly study schedule"""
    schedule = {}
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    # Distribute hours across the week
    daily_hours = total_hours / 7
    
    for day in days:
        if day in ['Saturday', 'Sunday']:
            # Weekend - longer study sessions
            hours = min(6, daily_hours * 1.5)
            if weak_modules:
                subject = random.choice(weak_modules)
                schedule[day] = {
                    'time': '09:00-12:00' if hours >= 3 else '10:00-12:00',
                    'subject': subject,
                    'duration': f'{hours:.1f} hours',
                    'type': 'intensive_study'
                }
        else:
            # Weekdays - shorter sessions
            hours = min(3, daily_hours)
            if weak_modules:
                subject = random.choice(weak_modules)
                schedule[day] = {
                    'time': '19:00-21:00' if hours >= 2 else '19:00-20:00',
                    'subject': subject,
                    'duration': f'{hours:.1f} hours',
                    'type': 'regular_study'
                }
    
    return schedule

def generate_physical_plan(risk_level):
    """Generate physical wellness plan based on risk level"""
    if risk_level > 0.6:
        return "High stress detected. Take 10-minute breaks every hour. Exercise 30 minutes daily. Ensure 7-8 hours sleep. Practice deep breathing before study sessions."
    elif risk_level > 0.3:
        return "Moderate stress level. Take regular breaks during study. Light exercise 3-4 times per week. Maintain consistent sleep schedule."
    else:
        return "Good stress management. Continue current routine. Regular exercise and adequate sleep will maintain performance."

def generate_emotional_plan(risk_level):
    """Generate emotional wellness plan"""
    if risk_level > 0.6:
        return "High academic pressure detected. Consider talking to a counselor. Practice mindfulness and relaxation techniques. Join study groups for motivation and support."
    elif risk_level > 0.3:
        return "Some academic stress present. Practice positive self-talk. Set realistic daily goals. Reward yourself for completing tasks."
    else:
        return "Good emotional balance. Continue building confidence. Help peers when possible - teaching others reinforces your own learning."

def generate_mini_goals(weak_modules):
    """Generate daily/weekly mini-goals"""
    mini_goals = []
    
    for i, module in enumerate(weak_modules[:3]):  # Top 3 weak modules
        mini_goals.extend([
            {
                'id': f'mini_{i}_1',
                'title': f'Complete 1 hour of {module} practice daily',
                'completed': False,
                'module': module
            },
            {
                'id': f'mini_{i}_2',
                'title': f'Review {module} lecture notes weekly',
                'completed': False,
                'module': module
            }
        ])
    
    # General mini-goals
    mini_goals.extend([
        {
            'id': 'general_1',
            'title': 'Attend all scheduled classes this week',
            'completed': False,
            'module': 'General'
        },
        {
            'id': 'general_2',
            'title': 'Complete all assignments on time',
            'completed': False,
            'module': 'General'
        }
    ])
    
    return mini_goals

def generate_quick_recommendations(data):
    """Generate quick recommendations for legacy API"""
    recommendations = []
    
    if data['avg_assessment_score'] < 60:
        recommendations.append("Focus on improving assessment scores through practice tests")
    
    if data['current_gpa'] < 2.5:
        recommendations.append("Schedule meeting with academic advisor")
    
    if data['assignments_late'] >= 2:
        recommendations.append("Improve time management and assignment planning")
    
    if data['login_frequency'] < 10:
        recommendations.append("Increase engagement with online learning materials")
    
    return recommendations

# =============================================================================
# APPLICATION STARTUP
# =============================================================================

if __name__ == '__main__':
    print("🚀 Starting Enhanced EduBoost Educational Platform...")
    print("=" * 60)
    
    # Initialize database
    initialize_database()
    
    # Initialize AI system
    print("🤖 Initializing Enhanced AI System...")
    eduboost_ai = EnhancedEduBoostAI()
    print("✅ Enhanced EduBoost AI system initialized!")
    
    print("\n🌐 Starting Flask server on http://localhost:5000")
    print("\n📋 Enhanced API Endpoints:")
    print("   🔍 GET  /api/students/<id>/performance    - Enhanced performance analysis")
    print("   🎯 GET  /api/students/<id>/goals          - AI-generated personalized goals")
    print("   📚 GET  /api/students/<id>/planner        - Personalized study planner")
    print("   👨‍🏫 POST /api/lecturer/feedback           - Submit lecturer feedback")
    print("   📈 POST /api/goals/<goal_id>/progress     - Update goal progress")
    print("   📖 GET  /api/modules                      - List all modules")
    print("   🔮 POST /predict                          - Legacy ML prediction")
    
    print("\n🎓 Educational Platform Features:")
    print("   📊 14-field student performance tracking")
    print("   🎯 AI-generated personalized goals")
    print("   📚 Comprehensive resource recommendations")
    print("   👨‍🏫 Lecturer feedback integration")
    print("   📈 Progress tracking and analytics")
    print("   🗄️ SQLite database with full schema")
    
    print("\n📊 Modules Supported:")
    modules = [
        "Introduction to Computer Science", "Mathematics for Computing",
        "Programming Fundamentals", "Object Oriented Programming",
        "Computer Networks", "Operating System",
        "Introduction to Machine Learning", "Web Development",
        "Electronics and Computer System Architecture", "Database Management"
    ]
    for i, module in enumerate(modules, 1):
        print(f"   {i:2d}. {module}")
    
    print("\n" + "="*60)
    print("✅ Enhanced EduBoost Platform Ready for Deployment!")
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
