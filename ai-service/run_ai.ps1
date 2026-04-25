# This script runs the AI service using the project's virtual environment
# to avoid "ModuleNotFoundError"
$venvPath = "..\.venv\Scripts\python.exe"

if (Test-Path $venvPath) {
    Write-Host "🚀 Starting AI Service using Virtual Environment..." -ForegroundColor Cyan
    & $venvPath app.py
} else {
    Write-Host "⚠️ Virtual Environment not found. Trying global python..." -ForegroundColor Yellow
    python app.py
}
