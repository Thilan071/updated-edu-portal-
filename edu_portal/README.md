# EduBoost Educational Platform

A comprehensive AI-powered educational support system that provides personalized learning recommendations, student performance analysis, and intelligent study planning.

## Features

- **Student Performance Analysis**: AI-driven analysis of student performance with risk assessment
- **Personalized Learning Goals**: Auto-generated goals based on student data and performance patterns
- **Intelligent Study Planner**: Customized study schedules with resource recommendations
- **Lecturer Feedback Integration**: System for educators to provide targeted feedback
- **Machine Learning Predictions**: Legacy ML endpoint for student success prediction

## Project Structure

```
edu_portal/
├── app.py                              # Main Flask application server
├── test_client.py                      # Basic API testing client
├── README.md                          # Project documentation
└── model/
    └── eduboost_ultra_accuracy_model.pkl  # Trained ML model (XGBoost)
```

## Quick Start

1. **Install Dependencies**:
   ```bash
   pip install flask pandas numpy scikit-learn xgboost requests
   ```

2. **Run the Server**:
   ```bash
   python app.py
   ```

3. **Test the API**:
   ```bash
   python test_client.py
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Educational Platform APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/students/<id>/performance` | GET | Student performance analysis and risk assessment |
| `/api/students/<id>/goals` | GET | AI-generated personalized learning goals |
| `/api/students/<id>/planner` | GET | Personalized study planner with resources |
| `/api/lecturer/feedback` | POST | Submit lecturer feedback for students |

### Legacy ML API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict` | POST | Machine learning prediction for student success |

## Usage Examples

### Get Student Performance Analysis
```bash
curl http://localhost:5000/api/students/12345/performance
```

### Get Personalized Goals
```bash
curl http://localhost:5000/api/students/12345/goals
```

### Submit Lecturer Feedback
```bash
curl -X POST http://localhost:5000/api/lecturer/feedback \
     -H "Content-Type: application/json" \
     -d '{
       "student_id": "12345",
       "module_name": "Machine Learning",
       "lecturer_id": "prof_smith",
       "feedback_text": "Great improvement in understanding"
     }'
```

### Legacy ML Prediction
```bash
curl -X POST http://localhost:5000/predict \
     -H "Content-Type: application/json" \
     -d '{
       "Module_Difficulty": 3,
       "Current_GPA": 3.2,
       "Avg_Assessment_Score": 75,
       "Assignments_Late": 1,
       "Num_Submission_Attempts": 2,
       "Login_Frequency": 15
     }'
```

## Model Information

- **Algorithm**: XGBoost Ensemble Model
- **Training Accuracy**: 80.7%
- **Features**: 32 educational and behavioral indicators
- **Fallback**: Rule-based system for compatibility

## Technical Stack

- **Backend**: Flask (Python)
- **ML Framework**: XGBoost, scikit-learn
- **Data Processing**: pandas, numpy
- **Model Storage**: pickle

## Development

The system uses a hybrid approach:
1. **Primary**: XGBoost model for high-accuracy predictions
2. **Fallback**: Rule-based system for compatibility and robustness

All student data is generated dynamically for demonstration purposes. In production, this would connect to your institution's student information system.

## License

Educational use - MIT License
