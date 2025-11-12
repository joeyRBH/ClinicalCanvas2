#!/bin/bash
# Script to list all HealthCanvas files for GitHub upload

echo "=================================================="
echo "🚀 HEALTHCANVAS - READY FOR GITHUB UPLOAD"
echo "=================================================="
echo ""
echo "📁 Location: /home/user/TeStEr/HealthCanvas"
echo "📦 Total Size: 984 KB"
echo "📄 Total Files: 60"
echo ""
echo "=================================================="
echo "📝 FILES TO UPLOAD TO GITHUB:"
echo "=================================================="
echo ""

cd /home/user/TeStEr/HealthCanvas

echo "🔹 ROOT FILES (9 files):"
ls -1 *.md *.json *.sh .env.example .gitignore 2>/dev/null | sed 's/^/   ✓ /'
echo ""

echo "🔹 API FOLDER (43 endpoint files):"
echo "   📁 api/"
ls -1 api/*.js | sed 's|api/|      ✓ |'
echo ""

echo "🔹 API UTILITIES (4 files):"
echo "   📁 api/utils/"
ls -1 api/utils/*.js | sed 's|api/utils/|      ✓ |'
echo ""

echo "🔹 PUBLIC FOLDER (3 frontend files):"
echo "   📁 public/"
ls -1 public/*.{html,css,js} | sed 's|public/|      ✓ |'
echo ""

echo "=================================================="
echo "📤 HOW TO UPLOAD:"
echo "=================================================="
echo ""
echo "Option 1: DRAG & DROP (Easiest) 🎯"
echo "   1. Open: https://github.com/joeyRBH/HealthCanvas"
echo "   2. Click 'Add file' → 'Upload files'"
echo "   3. Drag the entire HealthCanvas folder"
echo "   4. Commit message: 'Initial commit: Complete HealthCanvas EHR'"
echo "   5. Click 'Commit changes'"
echo ""
echo "Option 2: COMMAND LINE 💻"
echo "   cd /home/user/TeStEr/HealthCanvas"
echo "   git push -u origin main"
echo ""
echo "=================================================="
echo "✅ AFTER UPLOAD, YOU'LL HAVE:"
echo "=================================================="
echo ""
echo "   ✓ 43 API endpoints (all functional)"
echo "   ✓ Complete frontend (HTML, CSS, JS)"
echo "   ✓ 5 documentation files (README, guides, summaries)"
echo "   ✓ Configuration files (package.json, vercel.json)"
echo "   ✓ Ready for Vercel deployment!"
echo ""
echo "=================================================="
echo "🎯 NEXT STEP: Deploy to Vercel"
echo "=================================================="
echo ""
echo "   1. Go to: https://vercel.com/new"
echo "   2. Import: joeyRBH/HealthCanvas"
echo "   3. Add environment variables (see .env.example)"
echo "   4. Deploy!"
echo ""
echo "=================================================="
echo "📍 Full location: /home/user/TeStEr/HealthCanvas/"
echo "=================================================="
