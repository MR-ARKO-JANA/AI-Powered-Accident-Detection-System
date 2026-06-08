param(
    [string]$MongoUri = ""
)

# Automated Google Cloud Run Deployment Script for APADS
# This script builds container images using GCP Cloud Build and deploys them to Google Cloud Run.

$ErrorActionPreference = "Stop"

# Define default configuration
$Region = "us-central1"
$RepoName = "apads-repo"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "[*] Starting APADS deployment to Google Cloud Run..." -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Verify Google Cloud SDK installation and login
$ProjectId = (gcloud config get-value project)
if (-not $ProjectId) {
    Write-Host "[!] No default GCP project found in gcloud config." -ForegroundColor Yellow
    $ProjectId = Read-Host "Please enter your GCP Project ID"
    if (-not $ProjectId) {
        Write-Error "Deployment aborted: A GCP Project ID is required."
    }
    gcloud config set project $ProjectId
}
Write-Host "[INFO] Using GCP Project: $ProjectId" -ForegroundColor Green

# 2. Enable Google Cloud APIs
Write-Host "`n[*] Enabling GCP Service APIs (Artifact Registry, Cloud Build, Cloud Run)..." -ForegroundColor Yellow
gcloud services enable artifactregistry.googleapis.com `
                       run.googleapis.com `
                       cloudbuild.googleapis.com
Write-Host "[OK] Required APIs enabled successfully." -ForegroundColor Green

# 3. Create Artifact Registry Repository if not exists
Write-Host "`n[*] Checking Artifact Registry Repository..." -ForegroundColor Yellow
$repoExists = gcloud artifacts repositories list --location=$Region --filter="name:projects/$ProjectId/locations/$Region/repositories/$RepoName" --format="value(name)"
if (-not $repoExists) {
    Write-Host "[+] Creating Artifact Registry repository '$RepoName' in $Region..." -ForegroundColor Yellow
    gcloud artifacts repositories create $RepoName `
         --repository-format=docker `
         --location=$Region `
         --description="APADS Container Registry"
    Write-Host "[OK] Repository created." -ForegroundColor Green
} else {
    Write-Host "[OK] Repository '$RepoName' already exists." -ForegroundColor Green
}

# Keep track of original workspace path
$WorkspaceRoot = Get-Location

# 4. Build and Deploy Node.js Backend Service
Write-Host "`n[Step 1/3] Building & Deploying Node.js Backend..." -ForegroundColor Cyan
$BackendImageTag = "$Region-docker.pkg.dev/$ProjectId/$RepoName/backend:latest"

# Check or prompt user for Mongo URI configuration
if (-not $MongoUri) {
    Write-Host "-----------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "[DATABASE SETUP] Database Setup: Google Cloud Run requires an external database." -ForegroundColor Yellow
    Write-Host "   Please provide your MongoDB Atlas connection string (or press Enter for a default/local fallback)." -ForegroundColor Yellow
    Write-Host "-----------------------------------------------------------------" -ForegroundColor Yellow
    $MongoUri = Read-Host "Enter your MONGO_URI"
    if (-not $MongoUri) {
        Write-Host "[!] No MONGO_URI provided. Defaulting to local fallback (DB operations will fail if unreachable)." -ForegroundColor Yellow
        $MongoUri = "mongodb://localhost:27017/accident_detection"
    }
}

# Run Cloud Build for Backend
Write-Host "[*] Submitting backend container to Google Cloud Build..." -ForegroundColor Yellow
Push-Location "$WorkspaceRoot\backend"
gcloud builds submit --tag $BackendImageTag
Pop-Location

# Deploy Backend to Cloud Run
Write-Host "[*] Deploying backend service to Google Cloud Run..." -ForegroundColor Yellow
gcloud run deploy apads-backend `
    --image $BackendImageTag `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --set-env-vars MONGO_URI="$MongoUri",JWT_SECRET="production_jwt_secret_key_apads"

$BackendUrl = (gcloud run services describe apads-backend --platform managed --region $Region --format="value(status.url)")
Write-Host "[OK] Backend deployed successfully! URL: $BackendUrl" -ForegroundColor Green

# 5. Build and Deploy AI Service
Write-Host "`n[Step 2/3] Building & Deploying AI Service..." -ForegroundColor Cyan
$AiImageTag = "$Region-docker.pkg.dev/$ProjectId/$RepoName/ai-service:latest"

# Run Cloud Build for AI Service
Write-Host "[*] Submitting AI service container to Google Cloud Build..." -ForegroundColor Yellow
Push-Location "$WorkspaceRoot\ai-service"
gcloud builds submit --tag $AiImageTag
Pop-Location

# Deploy AI Service to Cloud Run (Pointed to Backend URL and with USE_CELERY=False)
Write-Host "[*] Deploying AI service to Google Cloud Run..." -ForegroundColor Yellow
gcloud run deploy apads-ai-service `
    --image $AiImageTag `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --set-env-vars USE_CELERY=False,BACKEND_URL="$BackendUrl/api/accidents",WEBSOCKET_URL="$BackendUrl"

$AiServiceUrl = (gcloud run services describe apads-ai-service --platform managed --region $Region --format="value(status.url)")
Write-Host "[OK] AI Service deployed successfully! URL: $AiServiceUrl" -ForegroundColor Green

# 6. Build and Deploy React Frontend Service
Write-Host "`n[Step 3/3] Building & Deploying React Frontend..." -ForegroundColor Cyan
$FrontendImageTag = "$Region-docker.pkg.dev/$ProjectId/$RepoName/frontend:latest"

# Generate temporary cloudbuild.yaml for passing build arguments to Docker
$CloudBuildYaml = @"
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: [
    'build',
    '--build-arg', 'REACT_APP_API_URL=$_REACT_APP_API_URL',
    '--build-arg', 'REACT_APP_AI_SERVICE_URL=$_REACT_APP_AI_SERVICE_URL',
    '-t', '$_IMAGE_NAME',
    '.'
  ]
images:
- '$_IMAGE_NAME'
"@

Push-Location "$WorkspaceRoot\frontend\my-app"
$CloudBuildYaml | Out-File -FilePath "cloudbuild.yaml" -Encoding utf8

# Submit Frontend Build
Write-Host "[*] Submitting frontend container to Google Cloud Build (this compiles React production bundle)..." -ForegroundColor Yellow
gcloud builds submit --config=cloudbuild.yaml --substitutions=_REACT_APP_API_URL="$BackendUrl",_REACT_APP_AI_SERVICE_URL="$AiServiceUrl",_IMAGE_NAME="$FrontendImageTag"

# Clean up temporary Cloud Build config file
if (Test-Path "cloudbuild.yaml") {
    Remove-Item "cloudbuild.yaml"
}
Pop-Location

# Deploy Frontend to Cloud Run
Write-Host "[*] Deploying frontend service to Google Cloud Run..." -ForegroundColor Yellow
gcloud run deploy apads-frontend `
    --image $FrontendImageTag `
    --platform managed `
    --region $Region `
    --allow-unauthenticated

$FrontendUrl = (gcloud run services describe apads-frontend --platform managed --region $Region --format="value(status.url)")

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "Frontend Dashboard URL : $FrontendUrl" -ForegroundColor Cyan
Write-Host "Node.js Backend URL     : $BackendUrl" -ForegroundColor Cyan
Write-Host "Flask AI Service URL    : $AiServiceUrl" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "Make sure to allow webcam access in your browser when testing the dashboard." -ForegroundColor Yellow
