# GitGrade - AI Repository Analyzer

An intelligent system that evaluates GitHub repositories using **Groq AI** and provides meaningful scores, summaries, and personalized roadmaps for developers.


## Deployment link :  

## 🎯 Problem Statement

In today's tech world, a GitHub repository represents a developer's tangible work, but most students don't know how good, clean, or complete their code looks to recruiters or mentors. GitGrade solves this by providing automated, AI-powered analysis of any public GitHub repository.

## ✨ Features

### 🤖 AI-Powered Analysis
- **Groq SDK Integration**: Uses Groq's fast LLM inference for intelligent analysis
- **Multi-Dimensional Evaluation**: Analyzes code quality, documentation, project structure, development activity, and best practices
- **Detailed Feedback**: Comprehensive AI-generated insights and recommendations

### 📊 Scoring System
- **0-100 Point Scale**: Comprehensive scoring across multiple dimensions
- **Rating Categories**: Beginner, Bronze, Silver, Gold classifications
- **Visual Breakdown**: Individual scores with progress bars and color coding

### 📝 Intelligent Feedback
- **Detailed Summary**: AI-generated comprehensive evaluation of repository
- **Project Description**: Clear explanation of what the project does
- **Tech Stack Analysis**: Analysis of technology choices and appropriateness
- **Personalized Roadmap**: 5-6 specific, actionable improvement suggestions

## 🏗️ Architecture

### Frontend (React)
- Modern React 18 with hooks
- Clean, responsive UI with Tailwind CSS
- Interactive file tree visualization
- Real-time analysis feedback

### Backend (Python + Groq)
- Flask API server
- Groq SDK for AI analysis
- Structured prompt engineering
- JSON response parsing

### Analysis Dimensions

1. **Code Quality (25 points)**: File organization, naming conventions, linting setup
2. **Documentation (20 points)**: README quality, code comments, API docs
3. **Project Structure (20 points)**: Folder organization, test coverage
4. **Development Activity (20 points)**: Commit frequency, message quality
5. **Best Practices (15 points)**: CI/CD, version control practices, licensing

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/gitgrade.git
cd gitgrade
```

### 2. Setup Environment Variables
```bash
cd backend
cp .env.example .env
# Edit .env file and add your Groq API key
```

### 3. Start the AI Backend
```bash
pip install -r requirements.txt
python app.py
```

### 4. Start the Frontend
```bash
# In a new terminal
npm install
npm run dev
```

### 5. Open the Application
Navigate to `http://localhost:5173` in your browser.

## 📋 Usage

1. **Enter Repository URL**: Paste any GitHub repository URL
2. **Click "Grade Repository"**: The system will fetch data and analyze with AI
3. **View Results**: Get comprehensive analysis including:
   - Overall score and rating
   - Detailed breakdown by category
   - Repository structure visualization
   - Technology stack analysis
   - AI-generated summary and feedback
   - Personalized improvement roadmap

## 🛠️ Technical Implementation

### Groq Integration
The system uses the Groq Python SDK exactly as specified:

```python
from groq import Groq

client = Groq(api_key="your-api-key")

def chat_with_groq(prompt):
    completion = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000
    )
    return completion.choices[0].message.content
```

### Analysis Flow
1. **Data Collection**: Fetch repository metadata, commits, files, README
2. **Data Processing**: Analyze file structure, detect tech stack, process commits
3. **AI Analysis**: Send structured data to Groq for intelligent evaluation
4. **Response Processing**: Parse AI response and format for frontend
5. **Visualization**: Display results with interactive UI components

## 📁 Project Structure

```
gitgrade/
├── src/
│   ├── App.jsx              # Main React component
│   └── main.jsx             # React entry point
├── backend/
│   ├── app.py               # Groq AI analysis service
│   └── requirements.txt     # Python dependencies
├── index.html               # HTML template
├── package.json            # Node.js dependencies
├── vite.config.js          # Vite configuration
└── README.md               # Documentation
```

## 🎨 UI Features

### Modern Design
- **Gradient Backgrounds**: Beautiful color gradients throughout
- **Interactive Elements**: Hover effects and smooth transitions
- **Progress Bars**: Visual representation of scores
- **Expandable File Tree**: Interactive repository structure
- **Responsive Layout**: Works on all device sizes

### Analysis Display
- **Score Visualization**: Large, prominent score with rating
- **Category Breakdown**: Individual scores with progress indicators
- **Tech Stack Badges**: Visual representation of technologies used
- **Roadmap Cards**: Numbered improvement suggestions
- **Status Indicators**: Real-time backend connection status

## 🔧 Configuration

### Backend Service
The backend runs on `http://localhost:5000` and provides:
- AI analysis endpoint
- Groq SDK integration
- Error handling and fallbacks
- CORS support for frontend

### Frontend Features
- Automatic backend status detection
- Fallback to rule-based analysis if AI unavailable
- Real-time analysis progress indicators
- Comprehensive error handling

## 📊 Example Analysis

### Input
```
Repository: https://github.com/facebook/react
```

### Output
```json
{
  "score": 91,
  "rating": "Gold",
  "summary": "This JavaScript project focuses on building user interfaces with React. The repository demonstrates excellent code organization, comprehensive documentation, and consistent development activity. With 1000+ commits and 500+ files, this project shows active development activity. Overall, this is a well-maintained project that follows good development practices.",
  "roadmap": [
    "Improve README with comprehensive project documentation",
    "Add comprehensive test coverage with unit tests",
    "Set up CI/CD pipeline using GitHub Actions",
    "Add code linting and formatting tools",
    "Implement proper error handling and logging"
  ]
}
```

## 🚀 Deployment

### Backend Deployment Options

Since this application has a Python Flask backend and a React frontend, you'll need to deploy them separately:

#### Option 1: Deploy Backend to Railway (Recommended)
1. Create an account at [railway.app](https://railway.app)
2. Create a new project and connect your GitHub repository
3. Set the root directory to `/backend`
4. Add the following environment variables in Railway:
   ```
   GROQ_API_KEY=your_actual_api_key_here
   ```
5. Railway will automatically detect and deploy your Flask app

#### Option 2: Deploy Backend to Render
1. Create an account at [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set the root directory to `/backend`
5. Set the build command to:
   ```bash
   pip install -r requirements.txt
   ```
6. Set the start command to:
   ```bash
   python app.py
   ```
7. Add the environment variable:
   ```
   GROQ_API_KEY=your_actual_api_key_here
   ```

### Frontend Deployment to Vercel

1. Create an account at [vercel.com](https://vercel.com)
2. Create a new project and connect your GitHub repository
3. Set the root directory to `/` (project root)
4. Set the build command to:
   ```bash
   npm run build
   ```
5. Set the output directory to:
   ```
   dist
   ```
6. Add the environment variable:
   ```
   VITE_API_BASE_URL=https://your-backend-url.com
   ```
   (Replace with your actual backend URL from Railway/Render)

### Environment Variables

Backend (.env in backend directory):
```
GROQ_API_KEY=your_actual_api_key_here
```

Frontend (.env in root directory):
```
VITE_API_BASE_URL=http://localhost:5000
```

Frontend (.env.production in root directory):
```
VITE_API_BASE_URL=https://your-deployed-backend-url.com
```

## deployment link : https://gitgrader.vercel.app/

---
