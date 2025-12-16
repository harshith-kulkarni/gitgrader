# GitGrade Backend Deployment Guide

## Deployment Options

### Railway (Recommended)
1. Go to [railway.app](https://railway.app) and create an account
2. Click "New Project" and select "Deploy from GitHub repo"
3. Connect your GitHub repository
4. Set the root directory to `/backend`
5. Railway will automatically detect this as a Python application
6. Add the environment variable in the Railway dashboard:
   ```
   GROQ_API_KEY=your_actual_groq_api_key_here
   ```
7. Click "Deploy" and wait for the deployment to complete

### Render
1. Go to [render.com](https://render.com) and create an account
2. Click "New+" and select "Web Service"
3. Connect your GitHub repository
4. Set the following configuration:
   - Name: gitgrade-backend
   - Root Directory: backend
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`
5. Add the environment variable:
   ```
   GROQ_API_KEY=your_actual_groq_api_key_here
   ```
6. Click "Create Web Service"

### Heroku
1. Install the Heroku CLI
2. Create a new Heroku app:
   ```bash
   heroku create gitgrade-backend
   ```
3. Set the buildpack:
   ```bash
   heroku buildpacks:set heroku/python
   ```
4. Set the environment variable:
   ```bash
   heroku config:set GROQ_API_KEY=your_actual_groq_api_key_here
   ```
5. Deploy:
   ```bash
   git subtree push --prefix backend heroku main
   ```

## Environment Variables

Required:
- `GROQ_API_KEY`: Your Groq API key from https://console.groq.com/keys

## Health Check Endpoint

Once deployed, you can check if the backend is running by visiting:
```
https://your-backend-url.com/health
```

This should return:
```json
{
  "status": "online",
  "groq_available": true,
  "message": "GitGrade Backend is running"
}
```