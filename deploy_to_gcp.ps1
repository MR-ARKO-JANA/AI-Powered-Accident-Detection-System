# Deployment Script for Google Compute Engine VM
# This will provision a cloud VM, install Docker, and launch your entire Enterprise System.

Write-Host "🚀 Starting Cloud Deployment to Google Compute Engine..." -ForegroundColor Cyan

# 1. Open Firewall Ports for the Dashboard, Backend, and AI Service
Write-Host "🔓 Configuring Firewall Rules..." -ForegroundColor Yellow
gcloud compute firewall-rules create allow-apads-ports `
    --allow tcp:3000,tcp:5000,tcp:5001 `
    --source-ranges 0.0.0.0/0 `
    --target-tags apads-server `
    --description "Allow traffic for APADS React, Node, and Flask"

# 2. Define the Startup Script
$startupScript = @"
#!/bin/bash
# Install dependencies
apt-get update
apt-get install -y docker.io docker-compose git

# Start Docker
systemctl enable docker
systemctl start docker

# Clone the repository
git clone https://github.com/MR-ARKO-JANA/AI-Powered-Accident-Detection-System.git /opt/apads

# Navigate to directory and build the cluster
cd /opt/apads
docker-compose up -d --build
"@

# 3. Provision the Virtual Machine
Write-Host "🖥️ Provisioning Virtual Machine (e2-medium)... This may take a minute." -ForegroundColor Yellow
gcloud compute instances create apads-production-vm `
    --zone=us-central1-a `
    --machine-type=e2-medium `
    --image-family=ubuntu-2204-lts `
    --image-project=ubuntu-os-cloud `
    --tags=http-server,https-server,apads-server `
    --metadata=startup-script="$startupScript"

Write-Host "✅ Deployment initiated!" -ForegroundColor Green
Write-Host "The server is starting up. It will take about 3-5 minutes for Docker to build all the images and start the services." -ForegroundColor Cyan
Write-Host "You can find the External IP address in the Google Cloud Console or in the output above." -ForegroundColor Cyan
