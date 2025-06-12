#!/bin/bash

# 中興大學選課小幫手 - 靜態版本建置腳本

echo "🚀 開始建置靜態版本..."

# 檢查 Node.js 和 npm
if ! command -v node &> /dev/null; then
    echo "❌ 錯誤: Node.js 未安裝"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 錯誤: npm 未安裝"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 安裝依賴
echo "📦 安裝依賴套件..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 安裝依賴失敗"
    exit 1
fi

# 建置靜態版本
echo "🔨 建置靜態版本..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 建置失敗"
    exit 1
fi

# 檢查輸出目錄
if [ ! -d "out" ]; then
    echo "❌ 建置輸出目錄不存在"
    exit 1
fi

# 計算文件大小
OUT_SIZE=$(du -sh out | cut -f1)
echo "📊 建置完成！輸出目錄大小: $OUT_SIZE"

# 列出主要文件
echo "📁 主要文件:"
ls -la out/

echo ""
echo "🎉 靜態版本建置成功！"
echo "📂 輸出目錄: ./out"
echo ""
echo "🌐 本地測試:"
echo "   cd out && python3 -m http.server 3000"
echo "   然後開啟 http://localhost:3000"
echo ""
echo "☁️  部署選項:"
echo "   1. GitHub Pages: 上傳 out/ 內容到 GitHub"
echo "   2. Netlify: 拖拽 out/ 目錄到 Netlify"
echo "   3. Vercel: cd out && vercel"
echo "   4. 其他: 上傳 out/ 內容到任何靜態託管服務"
echo ""
echo "📖 詳細說明請參考: STATIC_DEPLOYMENT.md"
