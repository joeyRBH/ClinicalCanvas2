#!/bin/bash
# GitHub Push Script for HealthCanvas
# Run this script to push your code to GitHub

cd /home/user/HealthCanvas

echo "🚀 Pushing HealthCanvas to GitHub..."
echo ""

# Ensure we're on main branch
git branch -M main

# Add GitHub remote (if not already added)
git remote remove origin 2>/dev/null
git remote add origin https://github.com/joeyRBH/HealthCanvas.git

# Push to GitHub
git push -u origin main

echo ""
echo "✅ Successfully pushed to GitHub!"
echo "📍 Repository: https://github.com/joeyRBH/HealthCanvas"
echo ""
echo "Next steps:"
echo "1. Visit https://vercel.com/new"
echo "2. Import the HealthCanvas repository"
echo "3. Configure environment variables (see .env.example)"
echo "4. Deploy!"
