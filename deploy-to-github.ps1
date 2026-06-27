# ============================================================
# TOON MAZE - GitHub + Vercel Deployment Script
# Double-click this file or run in PowerShell terminal
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TOON MAZE - GitHub Deployment Setup  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project folder
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

Write-Host "[1/5] Project folder: $projectPath" -ForegroundColor Green

# Check if git is installed
try {
    $gitVersion = git --version 2>&1
    Write-Host "[2/5] Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git not found! Please install Git from https://git-scm.com/download/win" -ForegroundColor Red
    Write-Host "After installing, run this script again." -ForegroundColor Yellow
    pause
    exit 1
}

# Initialize git if not already initialized
if (-not (Test-Path ".git")) {
    Write-Host "[3/5] Initializing Git repository..." -ForegroundColor Green
    git init
    git branch -M main
} else {
    Write-Host "[3/5] Git already initialized." -ForegroundColor Green
}

# Stage and commit all files
Write-Host "[4/5] Staging and committing all files..." -ForegroundColor Green
git add .
git commit -m "✨ Toon Maze - Playful cartoon arcade snake game" 2>&1
if ($LASTEXITCODE -ne 0) {
    # Maybe user/email not configured
    Write-Host "Setting git user config..." -ForegroundColor Yellow
    git config user.email "akshhkotian@users.noreply.github.com"
    git config user.name "akshhkotian"
    git add .
    git commit -m "✨ Toon Maze - Playful cartoon arcade snake game"
}

# Add remote and push
$repoUrl = "https://github.com/akshhkotian/toon-maze.git"
Write-Host "[5/5] Connecting to GitHub and pushing..." -ForegroundColor Green
Write-Host "Remote URL: $repoUrl" -ForegroundColor Gray

# Remove existing remote if any
git remote remove origin 2>&1 | Out-Null

# Add new remote
git remote add origin $repoUrl

# Push
Write-Host ""
Write-Host "Opening GitHub login in browser (if not already logged in)..." -ForegroundColor Yellow
Write-Host "A browser window may open for GitHub authentication." -ForegroundColor Yellow
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   SUCCESS! Code pushed to GitHub!      " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your GitHub repo: https://github.com/akshhkotian/toon-maze" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "NEXT STEP - Deploy to Vercel:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://vercel.com/new" -ForegroundColor White
    Write-Host "2. Click 'Import Git Repository'" -ForegroundColor White
    Write-Host "3. Select 'toon-maze' from the list" -ForegroundColor White
    Write-Host "4. Click 'Deploy'" -ForegroundColor White
    Write-Host ""
    Write-Host "Your game will be live at: https://toon-maze.vercel.app" -ForegroundColor Cyan
    Write-Host ""
    
    # Open GitHub repo in browser
    Start-Process "https://github.com/akshhkotian/toon-maze"
    Start-Process "https://vercel.com/new"
} else {
    Write-Host ""
    Write-Host "PUSH FAILED. Common fixes:" -ForegroundColor Red
    Write-Host ""
    Write-Host "Option 1 - Create the repo first:" -ForegroundColor Yellow
    Write-Host "  Go to https://github.com/new and create 'toon-maze' (empty, no README)" -ForegroundColor White
    Write-Host "  Then run this script again." -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2 - Use a Personal Access Token:" -ForegroundColor Yellow
    Write-Host "  Go to: https://github.com/settings/tokens/new" -ForegroundColor White
    Write-Host "  Create token with 'repo' scope" -ForegroundColor White
    Write-Host "  Run: git push https://TOKEN@github.com/akshhkotian/toon-maze.git main" -ForegroundColor White
}

Write-Host ""
pause
