"""
Enhanced EduBoost Model Accuracy Test
Test both rule-based system and XGBoost model accuracy
"""

import pickle
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import os
import random

def load_model():
    """Load the EduBoost model with proper XGBoost handling"""
    try:
        model_path = os.path.join('model', 'eduboost_ultra_accuracy_model.pkl')
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        print("✅ Model loaded successfully")
        
        # Inspect model structure
        if hasattr(model, 'keys'):
            print(f"📋 Model components: {list(model.keys())}")
        elif hasattr(model, '__dict__'):
            print(f"📋 Model attributes: {list(model.__dict__.keys())}")
        
        return model
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return None

def generate_extended_features(basic_features):
    """Generate the 32 features expected by the XGBoost model"""
    extended_data = []
    
    for _, row in basic_features.iterrows():
        # Start with basic features
        features = {
            'Module_Difficulty': row['Module_Difficulty'],
            'Current_GPA': row['Current_GPA'],
            'Avg_Assessment_Score': row['Avg_Assessment_Score'],
            'Assignments_Late': row['Assignments_Late'],
            'Num_Submission_Attempts': row['Num_Submission_Attempts'],
            'Login_Frequency': row['Login_Frequency']
        }
        
        # Generate extended features (reverse-engineered from model requirements)
        features.update({
            'GPA_Assessment_Ratio': row['Current_GPA'] / (row['Avg_Assessment_Score'] / 25) if row['Avg_Assessment_Score'] > 0 else 0,
            'Late_Submission_Ratio': row['Assignments_Late'] / max(row['Num_Submission_Attempts'], 1),
            'Performance_Index': (row['Current_GPA'] * 25 + row['Avg_Assessment_Score']) / 2,
            'Risk_Score_Basic': min(row['Assignments_Late'] * 2 + (4 - row['Current_GPA']), 10),
            'Engagement_Level': min(row['Login_Frequency'] / 20, 1),
            'Academic_Stress': row['Module_Difficulty'] * (5 - row['Current_GPA']),
            'Success_Probability': (row['Current_GPA'] + row['Avg_Assessment_Score']/25) / 2,
            'Submission_Efficiency': 1 / max(row['Num_Submission_Attempts'], 1),
            'GPA_Category': 1 if row['Current_GPA'] >= 3.5 else 2 if row['Current_GPA'] >= 3.0 else 3 if row['Current_GPA'] >= 2.5 else 4,
            'Assessment_Category': 1 if row['Avg_Assessment_Score'] >= 80 else 2 if row['Avg_Assessment_Score'] >= 70 else 3 if row['Avg_Assessment_Score'] >= 60 else 4,
            'Late_Category': 0 if row['Assignments_Late'] == 0 else 1 if row['Assignments_Late'] <= 2 else 2,
            'Login_Category': 1 if row['Login_Frequency'] >= 20 else 2 if row['Login_Frequency'] >= 10 else 3,
            'Difficulty_GPA_Interaction': row['Module_Difficulty'] * (5 - row['Current_GPA']),
            'Assessment_Login_Interaction': row['Avg_Assessment_Score'] * row['Login_Frequency'] / 100,
            'Late_GPA_Interaction': row['Assignments_Late'] * (4 - row['Current_GPA']),
            'Composite_Risk_1': (row['Assignments_Late'] * 2 + (100 - row['Avg_Assessment_Score']) / 10) / 2,
            'Composite_Risk_2': ((4 - row['Current_GPA']) * 2 + row['Module_Difficulty']) / 3,
            'Performance_Variance': abs(row['Current_GPA'] * 25 - row['Avg_Assessment_Score']),
            'Normalized_GPA': row['Current_GPA'] / 4.0,
            'Normalized_Assessment': row['Avg_Assessment_Score'] / 100.0,
            'Normalized_Login': min(row['Login_Frequency'] / 30, 1),
            'Binary_High_Risk_GPA': 1 if row['Current_GPA'] < 2.5 else 0,
            'Binary_Low_Assessment': 1 if row['Avg_Assessment_Score'] < 60 else 0,
            'Binary_Late_Issues': 1 if row['Assignments_Late'] >= 2 else 0,
            'Binary_Low_Engagement': 1 if row['Login_Frequency'] < 10 else 0,
            'Overall_Performance_Score': (row['Current_GPA'] * 0.4 + row['Avg_Assessment_Score']/100 * 0.4 + (1 - row['Assignments_Late']/10) * 0.2),
        })
        
        # Add remaining features to reach 32
        remaining_features = 32 - len(features)
        for i in range(remaining_features):
            features[f'Feature_{i+27}'] = np.random.normal(0, 1)  # Random features for padding
        
        extended_data.append(features)
    
    return pd.DataFrame(extended_data)

def generate_test_data(n_samples=1000):
    """Generate realistic test data"""
    np.random.seed(42)  # For reproducible results
    
    data = []
    labels = []
    
    for i in range(n_samples):
        # Generate correlated features that make educational sense
        current_gpa = np.random.normal(3.0, 0.8)
        current_gpa = np.clip(current_gpa, 0.0, 4.0)
        
        avg_assessment = current_gpa * 20 + np.random.normal(10, 15)
        avg_assessment = np.clip(avg_assessment, 0, 100)
        
        assignments_late = np.random.poisson(2) if current_gpa < 2.5 else np.random.poisson(0.5)
        login_frequency = np.random.poisson(15) if current_gpa > 3.0 else np.random.poisson(8)
        
        module_difficulty = np.random.uniform(1, 5)
        submission_attempts = np.random.poisson(1.5) + 1
        
        # Create ground truth
        risk_score = 0
        if current_gpa < 2.0: risk_score += 3
        elif current_gpa < 2.5: risk_score += 2
        elif current_gpa < 3.0: risk_score += 1
        
        if avg_assessment < 50: risk_score += 3
        elif avg_assessment < 60: risk_score += 2
        elif avg_assessment < 70: risk_score += 1
        
        if assignments_late >= 4: risk_score += 2
        elif assignments_late >= 2: risk_score += 1
        
        if login_frequency < 5: risk_score += 2
        elif login_frequency < 10: risk_score += 1
        
        at_risk = 1 if risk_score >= 4 else 0
        
        sample = {
            'Module_Difficulty': module_difficulty,
            'Current_GPA': current_gpa,
            'Avg_Assessment_Score': avg_assessment,
            'Assignments_Late': assignments_late,
            'Num_Submission_Attempts': submission_attempts,
            'Login_Frequency': login_frequency
        }
        
        data.append(sample)
        labels.append(at_risk)
    
    return pd.DataFrame(data), np.array(labels)

def rule_based_predictions(df):
    """Generate predictions using rule-based system"""
    predictions = []
    
    for _, row in df.iterrows():
        risk_score = 0
        
        if row['Current_GPA'] < 2.5: risk_score += 2
        elif row['Current_GPA'] < 3.0: risk_score += 1
        
        if row['Avg_Assessment_Score'] < 60: risk_score += 2
        elif row['Avg_Assessment_Score'] < 70: risk_score += 1
        
        if row['Assignments_Late'] >= 3: risk_score += 2
        elif row['Assignments_Late'] >= 1: risk_score += 1
        
        if row['Login_Frequency'] < 10: risk_score += 1
        
        prediction = 1 if risk_score >= 3 else 0
        predictions.append(prediction)
    
    return np.array(predictions)

def test_comprehensive_accuracy():
    """Test comprehensive model accuracy"""
    print("🔬 Enhanced EduBoost Model Accuracy Test")
    print("=" * 60)
    
    # Load model
    model = load_model()
    
    # Generate test data
    print("📊 Generating test data...")
    X_basic, y_true = generate_test_data(1000)
    
    print(f"✅ Generated {len(X_basic)} test samples")
    print(f"📈 Class distribution: {np.bincount(y_true)} (0: Low Risk, 1: High Risk)")
    print(f"📊 Risk rate: {np.mean(y_true)*100:.1f}%")
    print()
    
    # Test rule-based system
    print("🔧 Testing Rule-Based System:")
    rule_predictions = rule_based_predictions(X_basic)
    rule_accuracy = accuracy_score(y_true, rule_predictions)
    
    print(f"📊 Rule-Based Accuracy: {rule_accuracy:.3f} ({rule_accuracy*100:.1f}%)")
    print("📋 Classification Report:")
    print(classification_report(y_true, rule_predictions, target_names=['Low Risk', 'High Risk']))
    
    # Confusion Matrix
    cm_rule = confusion_matrix(y_true, rule_predictions)
    print("🎯 Confusion Matrix:")
    print(f"    Predicted: Low  High")
    print(f"True Low:      {cm_rule[0,0]:3d}   {cm_rule[0,1]:3d}")
    print(f"True High:     {cm_rule[1,0]:3d}   {cm_rule[1,1]:3d}")
    print()
    
    # Test ML model if available
    if model is not None:
        try:
            print("🤖 Testing XGBoost Model:")
            
            # Generate extended features for XGBoost
            X_extended = generate_extended_features(X_basic)
            print(f"📈 Extended to {X_extended.shape[1]} features")
            
            # Try different model access methods
            if hasattr(model, 'predict'):
                # Direct prediction
                ml_predictions = model.predict(X_extended)
            elif isinstance(model, dict) and 'xgb_model' in model:
                # XGBoost model in dictionary
                xgb_model = model['xgb_model']
                if 'scaler' in model:
                    scaler = model['scaler']
                    X_scaled = scaler.transform(X_extended)
                    ml_predictions = xgb_model.predict(X_scaled)
                else:
                    ml_predictions = xgb_model.predict(X_extended)
            else:
                raise Exception("Unknown model structure")
            
            # Ensure binary predictions
            if hasattr(ml_predictions, 'shape') and len(ml_predictions.shape) > 1:
                ml_predictions = np.argmax(ml_predictions, axis=1)
            
            ml_predictions = (ml_predictions > 0.5).astype(int)
            
            ml_accuracy = accuracy_score(y_true, ml_predictions)
            print(f"📊 XGBoost Model Accuracy: {ml_accuracy:.3f} ({ml_accuracy*100:.1f}%)")
            print("📋 Classification Report:")
            print(classification_report(y_true, ml_predictions, target_names=['Low Risk', 'High Risk']))
            
            # Confusion Matrix
            cm_ml = confusion_matrix(y_true, ml_predictions)
            print("🎯 Confusion Matrix:")
            print(f"    Predicted: Low  High")
            print(f"True Low:      {cm_ml[0,0]:3d}   {cm_ml[0,1]:3d}")
            print(f"True High:     {cm_ml[1,0]:3d}   {cm_ml[1,1]:3d}")
            
            # Compare models
            print(f"\n📈 Model Comparison:")
            print(f"Rule-Based:  {rule_accuracy*100:.1f}%")
            print(f"XGBoost:     {ml_accuracy*100:.1f}%")
            improvement = (ml_accuracy - rule_accuracy) * 100
            print(f"Improvement: {improvement:+.1f}% points")
            
        except Exception as e:
            print(f"❌ Error testing XGBoost model: {e}")
            print("🔄 Using rule-based system only")
    
    else:
        print("⚠️ XGBoost model not available")
    
    print("\n" + "=" * 60)
    print("✅ Comprehensive accuracy test completed!")
    
    return rule_accuracy, ml_accuracy if model else None

if __name__ == "__main__":
    test_comprehensive_accuracy()
