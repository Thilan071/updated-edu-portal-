# ML Backend Integration for EduBoost

## Overview

This document describes the integration between the EduBoost Next.js frontend and the Flask ML backend for AI-powered educational features.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   API Proxy     │    │  Flask ML API   │
│  (Port 3000)    │───▶│  /api/ml/*      │───▶│  (Port 5000)    │
│                 │    │                 │    │                 │
│ Repeat Prep     │    │ Authentication  │    │ AI Goals        │
│ Page            │    │ CORS Handling   │    │ Predictions     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### 1. Flask ML Backend (`edu_portal/app.py`)
- **Location**: `c:\Users\LENOVO\Downloads\next\edu_portal\`
- **Port**: 5000
- **Key Endpoints**:
  - `GET /api/students/{id}/goals` - AI-generated personalized goals
  - `GET /api/students/{id}/performance` - Performance analysis
  - `GET /api/students/{id}/planner` - Study planner
  - `POST /predict` - ML predictions

### 2. ML API Client (`src/lib/mlApiClient.js`)
- Handles communication with the ML backend
- Uses Next.js API routes as proxy for authentication
- Provides methods for fetching goals, performance data, and predictions

### 3. Next.js API Proxy (`src/app/api/ml/goals/[studentId]/route.js`)
- Authenticates requests using existing auth system
- Handles CORS issues
- Proxies requests to Flask backend

### 4. Updated Repeat Preparation Page (`src/app/dashboard/student/repeat/page.jsx`)
- Added click handlers for module cards
- Integrated modal for displaying AI-generated goals
- Real-time fetching of personalized recommendations

## Environment Configuration

The ML backend URL is configured in `.env.local`:

```env
ML_API_URL=http://127.0.0.1:5000
```

## Features Implemented

### 🎯 AI-Generated Goals
When a student clicks on a module card in the Repeat Preparation page:

1. **Authentication**: Verifies user session
2. **API Call**: Fetches personalized goals from ML backend
3. **Display**: Shows goals in an interactive modal with:
   - Goal statistics (total, high priority, completion timeline)
   - Individual goal details with success criteria
   - Progress tracking
   - AI recommendations for study hours and completion time

### 📊 Goal Data Structure
```json
{
  "student_id": "STUD001",
  "goals": [
    {
      "goal_id": "uuid",
      "goal_title": "Improve SQL Queries",
      "goal_description": "Focus on complex JOIN operations",
      "module_name": "Database Management",
      "priority_level": "high",
      "current_progress": 0,
      "target_completion_date": "2025-09-09",
      "days_remaining": 13,
      "success_criteria": [
        "Practice complex JOIN operations",
        "Complete normalization exercises"
      ]
    }
  ],
  "completion_stats": {
    "total_goals": 6,
    "high_priority_goals": 5,
    "completion_rate": 0.0
  },
  "recommendations": {
    "suggested_daily_study_hours": 8,
    "estimated_completion_weeks": 10
  }
}
```

## How to Use

### Starting the Services

1. **Start Flask ML Backend**:
   ```bash
   cd edu_portal
   python app.py
   ```
   - Server runs on `http://localhost:5000`
   - Includes 14-field student performance tracking
   - AI-generated goals and recommendations

2. **Start Next.js Frontend**:
   ```bash
   npm run dev
   ```
   - Server runs on `http://localhost:3000`
   - Includes authentication and API proxy

### Testing the Integration

1. Navigate to: `http://localhost:3000/dashboard/student/repeat`
2. Log in as a student
3. Click on any module card (e.g., "Database Management")
4. View AI-generated goals in the modal

## API Endpoints

### Next.js API Routes
- `GET /api/ml/goals/[studentId]` - Fetch AI goals (authenticated)

### Flask ML Backend
- `GET /api/students/{id}/goals` - AI-generated goals
- `GET /api/students/{id}/performance` - Performance analysis
- `GET /api/students/{id}/planner` - Personalized study planner
- `POST /api/goals/{id}/progress` - Update goal progress
- `POST /predict` - ML predictions

## Security

- All API calls are authenticated through Next.js auth system
- Students can only access their own data
- Educators can access student data they're authorized for
- CORS is handled by the Next.js API proxy

## Database

The ML backend uses SQLite (`eduboost.db`) with tables for:
- Student performance (14 fields)
- Lecturer feedback
- Student goals
- Learning resources
- Goal-resource mappings

## Supported Modules

1. Introduction to Computer Science
2. Mathematics for Computing
3. Programming Fundamentals
4. Object Oriented Programming
5. Computer Networks
6. Operating System
7. Introduction to Machine Learning
8. Web Development
9. Electronics and Computer System Architecture
10. Database Management

## Future Enhancements

- Real-time progress updates
- Goal completion tracking
- Resource recommendations
- Performance predictions
- Lecturer feedback integration
- Mobile app support

## Troubleshooting

### Common Issues

1. **ML Backend not responding**:
   - Check if Flask server is running on port 5000
   - Verify `ML_API_URL` in `.env.local`

2. **Authentication errors**:
   - Ensure user is logged in
   - Check session validity

3. **CORS issues**:
   - Use the Next.js API proxy routes
   - Don't call Flask backend directly from frontend

### Logs

- **Next.js logs**: Check terminal running `npm run dev`
- **Flask logs**: Check terminal running `python app.py`
- **Browser console**: Check for frontend errors

## Status

✅ **Completed**:
- Flask ML backend running
- Next.js API proxy configured
- Repeat preparation page updated
- AI goals integration working
- Authentication and security implemented

🚀 **Ready for Production**: The integration is fully functional and ready for use!