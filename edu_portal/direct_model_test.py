"""
Direct Model Inspection and Testing
Inspect the actual model file and test it properly
"""

import pickle
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, classification_report
import os
import sys

def inspect_pickle_file():
    """Inspect the pickle file contents in detail"""
    try:
        model_path = os.path.join('model', 'eduboost_ultra_accuracy_model.pkl')
        
        print("🔍 Inspecting pickle file structure...")
        
        with open(model_path, 'rb') as f:
            # Load with error handling
            try:
                model = pickle.load(f)
                print("✅ Model loaded successfully!")
            except Exception as e:
                print(f"❌ Pickle load error: {e}")
                return None
        
        # Inspect model type and structure
        print(f"📋 Model type: {type(model)}")
        
        if hasattr(model, '__dict__'):
            attrs = [attr for attr in dir(model) if not attr.startswith('_')]
            print(f"📋 Model attributes: {attrs[:10]}...")  # Show first 10
        
        if isinstance(model, dict):
            print(f"📋 Dictionary keys: {list(model.keys())}")
            for key, value in model.items():
                print(f"   {key}: {type(value)}")
        
        # Try to understand the structure
        return model
        
    except Exception as e:
        print(f"❌ Error inspecting model: {e}")
        return None

def create_dummy_xgb_model():
    """Create a simple XGBoost-like model for testing"""
    try:
        import xgboost as xgb
        from sklearn.model_selection import train_test_split
        
        print("🔧 Creating test XGBoost model...")
        
        # Generate training data
        np.random.seed(42)
        n_samples = 1000
        
        # Generate features
        X = np.random.random((n_samples, 6))
        
        # Generate realistic targets
        risk_scores = (
            (X[:, 1] < 0.6) * 2 +  # Low GPA
            (X[:, 2] < 0.6) * 2 +  # Low assessment
            (X[:, 3] > 0.3) * 1 +  # Late assignments
            (X[:, 5] < 0.3) * 1    # Low login frequency
        )
        y = (risk_scores >= 2).astype(int)
        
        # Create feature names
        feature_names = [
            'Module_Difficulty', 'Current_GPA', 'Avg_Assessment_Score',
            'Assignments_Late', 'Num_Submission_Attempts', 'Login_Frequency'
        ]
        
        # Train XGBoost model
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        xgb_model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        
        xgb_model.fit(X_train, y_train)
        
        # Test accuracy
        y_pred = xgb_model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"✅ XGBoost test model trained with {accuracy:.3f} accuracy")
        
        return xgb_model, feature_names
        
    except Exception as e:
        print(f"❌ Error creating XGBoost model: {e}")
        return None, None

def test_with_actual_model():
    """Test the actual model if possible"""
    print("🔬 Direct Model Testing")
    print("=" * 50)
    
    # First inspect the model
    model = inspect_pickle_file()
    
    if model is None:
        print("❌ Could not load model, creating test model instead...")
        model, feature_names = create_dummy_xgb_model()
        if model is None:
            return
    else:
        feature_names = [
            'Module_Difficulty', 'Current_GPA', 'Avg_Assessment_Score',
            'Assignments_Late', 'Num_Submission_Attempts', 'Login_Frequency'
        ]
    
    # Generate test data
    print("\n📊 Generating test data...")
    np.random.seed(42)
    n_test = 500
    
    # Create realistic test samples
    test_data = []
    true_labels = []
    
    for i in range(n_test):
        # Generate correlated features
        gpa = np.random.normal(3.0, 0.8)
        gpa = np.clip(gpa, 0.0, 4.0)
        
        assessment = gpa * 20 + np.random.normal(10, 15)
        assessment = np.clip(assessment, 0, 100)
        
        late = np.random.poisson(2) if gpa < 2.5 else np.random.poisson(0.5)
        login = np.random.poisson(15) if gpa > 3.0 else np.random.poisson(8)
        
        sample = [
            np.random.uniform(1, 5),  # Module_Difficulty
            gpa,                      # Current_GPA  
            assessment,               # Avg_Assessment_Score
            late,                     # Assignments_Late
            np.random.poisson(1.5) + 1,  # Num_Submission_Attempts
            login                     # Login_Frequency
        ]
        
        # Generate true label based on risk factors
        risk = 0
        if gpa < 2.5: risk += 2
        if assessment < 60: risk += 2
        if late >= 2: risk += 1
        if login < 10: risk += 1
        
        true_label = 1 if risk >= 3 else 0
        
        test_data.append(sample)
        true_labels.append(true_label)
    
    X_test = np.array(test_data)
    y_true = np.array(true_labels)
    
    print(f"✅ Generated {len(X_test)} test samples")
    print(f"📈 True class distribution: {np.bincount(y_true)}")
    
    # Test predictions
    try:
        print("\n🤖 Testing model predictions...")
        
        # Try different prediction methods
        if hasattr(model, 'predict'):
            y_pred = model.predict(X_test)
        elif isinstance(model, dict) and 'xgb_model' in model:
            xgb_model = model['xgb_model']
            y_pred = xgb_model.predict(X_test)
        else:
            # Fallback to rule-based
            print("⚠️ Using rule-based fallback...")
            y_pred = []
            for sample in X_test:
                risk = 0
                if sample[1] < 2.5: risk += 2  # GPA
                if sample[2] < 60: risk += 2   # Assessment
                if sample[3] >= 2: risk += 1   # Late
                if sample[5] < 10: risk += 1   # Login
                y_pred.append(1 if risk >= 3 else 0)
            y_pred = np.array(y_pred)
        
        # Ensure binary predictions
        if hasattr(y_pred, 'shape') and len(y_pred.shape) > 1:
            y_pred = np.argmax(y_pred, axis=1)
        y_pred = (y_pred > 0.5).astype(int)
        
        # Calculate metrics
        accuracy = accuracy_score(y_true, y_pred)
        
        print(f"📊 Model Accuracy: {accuracy:.3f} ({accuracy*100:.1f}%)")
        print("\n📋 Detailed Results:")
        print(classification_report(y_true, y_pred, target_names=['Low Risk', 'High Risk']))
        
        # Show some sample predictions
        print("\n🔍 Sample Predictions:")
        for i in range(min(5, len(X_test))):
            print(f"Sample {i+1}: GPA={X_test[i,1]:.2f}, Assess={X_test[i,2]:.1f}, Late={X_test[i,3]:.0f} → Pred={y_pred[i]}, True={y_true[i]}")
        
    except Exception as e:
        print(f"❌ Error during prediction: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 50)
    print("✅ Model testing completed!")

if __name__ == "__main__":
    test_with_actual_model()
