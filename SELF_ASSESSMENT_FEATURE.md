# Student Self-Assessment Feature

This document outlines the new self-assessment feature implemented for the student portal.

## Overview

The self-assessment feature allows students to track their progress and confidence level on assignments independently of the formal submission process. This provides students with a tool for self-reflection and helps educators understand student confidence levels.

## Features Implemented

### 1. Self-Assessment API
- **Endpoint**: `/api/student-self-assessment`
- **Methods**: GET (fetch) and POST (update)
- **Authentication**: Student role required
- **Data Stored**:
  - Progress percentage (0-100%)
  - Work completion status (boolean)
  - Optional notes
  - PDF file upload URL
  - Timestamps for creation and updates

### 2. Database Integration
- **Collection**: `student_self_assessments`
- **Fields**:
  - `studentId`: Firebase UID of the student
  - `assignmentId`: Assignment template ID
  - `moduleId`: Module ID
  - `progressPercentage`: Student's confidence level (0-100)
  - `workUploaded`: Boolean indicating if work is complete
  - `notes`: Optional text notes
  - `fileUrl`: URL to uploaded PDF file
  - `createdAt` and `updatedAt`: Timestamps

### 3. Enhanced Student Assignment Page
- **New Section**: Dedicated self-assessment area
- **Interactive Slider**: Visual progress indicator (0-100%)
- **Work Status Checkbox**: Track completion status
- **Notes Field**: Optional text area for student reflections
- **PDF Upload**: File upload for work submission (PDF only)
- **AI Analysis**: Gemini AI-powered assessment of student work
- **Save Functionality**: Independent of assignment submission

## How It Works

### For Students:
1. **Access Assignment**: Navigate to any active assignment
2. **Self-Assessment Section**: Located between assignment description and submission
3. **Set Confidence Level**: Use slider to indicate progress (0-100%)
4. **Mark Work Status**: Check box when work is complete
5. **Add Notes**: Optional field for reflections or questions
6. **Upload Work**: Upload PDF files of completed work
7. **Save Progress**: Click "Save Self-Assessment" button
8. **Update Anytime**: Can modify assessment and re-upload files before final submission

### For Educators:
1. **Publish Assignments**: Use existing activation process
2. **Monitor Progress**: Self-assessment data available through API
3. **View Student Confidence**: Understand student perception vs. actual performance
4. **Identify Struggling Students**: Low confidence scores may indicate need for support

## Technical Implementation

### API Endpoints
```javascript
// Get self-assessment
GET /api/student-self-assessment?assignmentId=X&moduleId=Y

// Update self-assessment
POST /api/student-self-assessment
{
  "assignmentId": "assignment_id",
  "moduleId": "module_id",
  "progressPercentage": 75,
  "workUploaded": true,
  "notes": "Making good progress, need help with final section",
  "fileUrl": "/uploads/self-assessment/1234567890_student_id_document.pdf"
}

// File upload for self-assessment
POST /api/upload
FormData: {
  file: PDF file,
  assignmentId: "assignment_id",
  moduleId: "module_id",
  type: "self-assessment"
}

// AI assessment analysis
POST /api/ai-assessment
{
  "assignmentId": "assignment123",
  "moduleId": "module456",
  "studentWork": "Student's text submission...",
  "uploadedFiles": ["/uploads/self-assessment/file.pdf"],
  "assessmentCriteria": "Assignment description and requirements..."
}

// Get AI assessment results
GET /api/ai-assessment?assignmentId=X&moduleId=Y
```

### Frontend Integration
```javascript
// Fetch self-assessment
const response = await apiClient.selfAssessmentAPI.get(assignmentId, moduleId);

// Update self-assessment
await apiClient.selfAssessmentAPI.update({
  assignmentId,
  moduleId,
  progressPercentage: 80,
  workUploaded: true,
  notes: "Almost complete",
  fileUrl: "/uploads/self-assessment/1234567890_student_id_work.pdf"
});

// File upload handling
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('assignmentId', assignmentId);
formData.append('moduleId', moduleId);
formData.append('type', 'self-assessment');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

## Benefits

### For Students:
- **Self-Reflection**: Encourages thinking about their own learning
- **Progress Tracking**: Visual representation of confidence levels
- **Communication Tool**: Notes field for questions or concerns
- **Stress Reduction**: Separate from formal grading
- **Work Documentation**: Allows students to upload and track their work files
- **Portfolio Building**: Creates a digital portfolio of student work over time
- **AI-Powered Insights**: Intelligent analysis provides objective assessment of work quality
- **Instant Feedback**: Immediate AI feedback helps students understand their progress
- **Personalized Guidance**: AI provides specific, actionable suggestions for improvement
- **Quality Improvement**: AI feedback helps students enhance their work before final submission

### For Educators:
- **Early Warning System**: Identify students who lack confidence
- **Engagement Insights**: See how students perceive their progress
- **Support Targeting**: Focus help on students with low confidence
- **Metacognitive Development**: Encourage student self-awareness
- **Objective Assessment Data**: AI analysis provides additional insights beyond student self-perception

## Usage Workflow

1. **Lecturer publishes assignment** (existing process)
2. **Student accesses assignment** through student portal
3. **Student works on assignment** and periodically updates self-assessment
4. **Student uploads work** (PDF files of completed work - optional)
5. **AI Analysis** - Student clicks "Analyze with AI" to get intelligent assessment
   - AI analyzes text submission and uploaded files
   - Automatically suggests progress percentage
   - Provides detailed feedback on completed/missing components
   - Offers specific improvement suggestions
6. **Manual adjustment** - Student fine-tunes AI suggestions using the progress slider
7. **Student marks work completion** when ready
8. **Student adds notes** about progress or challenges
9. **Student saves self-assessment** (can update multiple times)
10. **Student reviews AI feedback** in detailed analysis results panel
11. **Student submits final work** (separate from self-assessment)
12. **Educator can view** both self-assessment and actual submission

## File Upload Features

- **PDF Support**: Accepts PDF files up to 10MB in size
- **Secure Storage**: Files stored in organized directory structure
- **Unique Naming**: Prevents file conflicts with timestamp and user ID
- **Access Control**: Only authenticated students can upload files
- **File Validation**: Ensures only PDF files are accepted for self-assessment
- **Download Links**: Students can view their uploaded files anytime

## AI Analysis Features

### Gemini AI Integration

- **Intelligent Assessment**: Uses Google's Gemini AI to analyze student work
- **Multi-format Support**: Analyzes text submissions, uploaded PDFs, and assignment descriptions
- **Automated Progress Calculation**: AI suggests progress percentage (0-100%) based on work quality
- **Detailed Feedback**: Provides specific feedback on completed and missing components
- **Improvement Suggestions**: Offers actionable recommendations for next steps

### Analysis Components

- **Work Quality Evaluation**: Assesses the quality and completeness of submitted work
- **Criteria Alignment**: Compares work against assignment requirements and rubrics
- **Component Tracking**: Identifies which required components are present or missing
- **Progress Estimation**: Calculates completion percentage based on multiple factors
- **Personalized Feedback**: Generates specific, actionable feedback for each student

### AI Analysis Workflow

1. **Data Collection**: Gathers student work (text + uploaded files) and assignment criteria
2. **Prompt Generation**: Creates structured prompts for Gemini AI analysis
3. **AI Processing**: Sends data to Gemini API for intelligent assessment
4. **Result Parsing**: Processes AI response and validates the analysis results
5. **Auto-Population**: Updates progress slider and notes with AI suggestions
6. **Feedback Display**: Shows detailed analysis results in an interactive UI panel

## Future Enhancements

### AI and Machine Learning
- **Advanced AI Models**: Integration with newer AI models for better analysis
- **Learning Pattern Recognition**: AI identifies individual learning patterns and preferences
- **Predictive Analytics**: AI predicts potential challenges and suggests preventive measures
- **Multi-language Support**: AI analysis in multiple languages
- **Voice Analysis**: Support for audio submissions and voice-based feedback
- **Image Recognition**: AI analysis of diagrams, charts, and visual work

### User Experience
- **Analytics Dashboard**: Visualize self-assessment trends
- **Peer Comparison**: Anonymous comparison with class averages
- **Reminder System**: Prompt students to update assessments
- **Mobile Optimization**: Improve mobile experience for slider controls

### Technical Enhancements
- **Integration with Grading**: Compare self-assessment with actual grades
- **Multiple File Types**: Support for images, documents, and other file formats
- **File Versioning**: Track multiple versions of uploaded work
- **Collaborative Features**: Allow peer review of uploaded work
- **Real-time Collaboration**: Live editing and feedback features
- **API Extensions**: Enhanced APIs for third-party integrations

This feature enhances the learning experience by promoting self-reflection and providing educators with valuable insights into student confidence and engagement levels.