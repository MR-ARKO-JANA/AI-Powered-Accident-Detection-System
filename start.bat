@echo off
echo Starting APADS Backend...
start cmd /k "cd backend && npm install && npm start"

echo Starting APADS AI Service...
start cmd /k "cd ai-service && pip install -r requirements.txt && python app.py"

echo Starting APADS Frontend...
start cmd /k "cd frontend\my-app && npm install && npm start"

echo All services launched in separate windows!
