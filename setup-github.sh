#!/bin/bash

# 🚀 GitHub 部署快速設置腳本
# 中興大學選課小幫手

echo "🚀 開始設置 GitHub 部署..."
echo "=================================="

# 檢查是否在正確的目錄
if [ ! -f "course_crawler.py" ]; then
    echo "❌ 錯誤: 請在 Course_Selector 專案根目錄執行此腳本"
    exit 1
fi

# 檢查 Git 是否已初始化
if [ ! -d ".git" ]; then
    echo "❌ 錯誤: Git 尚未初始化，請先執行 git init"
    exit 1
fi

# 提示用戶輸入 GitHub 資訊
echo ""
echo "📝 請提供您的 GitHub 資訊："
read -p "GitHub 用戶名: " GITHUB_USERNAME
read -p "倉庫名稱 (預設: Course_Selector): " REPO_NAME

# 設定預設值
if [ -z "$REPO_NAME" ]; then
    REPO_NAME="Course_Selector"
fi

# 設置遠端倉庫
echo ""
echo "🔗 設置遠端倉庫..."
REPO_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

# 檢查是否已有遠端倉庫
if git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  遠端倉庫已存在，移除舊的設定..."
    git remote remove origin
fi

git remote add origin $REPO_URL
echo "✅ 遠端倉庫設置完成: $REPO_URL"

# 設置主分支
echo ""
echo "🌿 設置主分支..."
git branch -M main
echo "✅ 主分支設置為 main"

# 提交任何未提交的變更
echo ""
echo "💾 檢查並提交變更..."
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 發現未提交的變更，正在提交..."
    git add .
    git commit -m "🔧 更新部署設置與文檔

- 添加 GitHub 部署指南
- 更新自動化腳本
- 準備推送到 GitHub"
else
    echo "✅ 沒有待提交的變更"
fi

# 推送到 GitHub
echo ""
echo "📤 推送代碼到 GitHub..."
echo "⚠️  如果這是首次推送，可能需要您的 GitHub 認證"

if git push -u origin main; then
    echo "✅ 代碼推送成功！"
else
    echo "❌ 推送失敗，請檢查："
    echo "   1. GitHub 倉庫是否已創建"
    echo "   2. 用戶名和倉庫名是否正確"
    echo "   3. 是否有推送權限"
    exit 1
fi

# 顯示後續步驟
echo ""
echo "🎉 GitHub 設置完成！"
echo "=================================="
echo ""
echo "📋 接下來請手動完成以下步驟："
echo ""
echo "1️⃣  設置 GitHub Pages:"
echo "   • 前往: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/settings/pages"
echo "   • Source: Deploy from a branch"
echo "   • Branch: gh-pages (執行 Actions 後會出現)"
echo "   • Folder: / (root)"
echo ""
echo "2️⃣  執行首次 GitHub Actions:"
echo "   • 前往: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/actions"
echo "   • 點擊 '每日課程資料更新與部署'"
echo "   • 點擊 'Run workflow' 按鈕"
echo ""
echo "3️⃣  檢查部署結果:"
echo "   • 網站網址: https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/"
echo "   • 首次部署可能需要 5-10 分鐘"
echo ""
echo "📚 詳細指南請參考: GITHUB_DEPLOYMENT.md"
echo ""
echo "🤖 自動更新排程: 每天台灣時間早上 6:00"
echo ""
echo "✨ 祝您使用愉快！"
