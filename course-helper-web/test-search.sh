#!/bin/bash

# 縮寫搜尋功能測試腳本

echo "🔍 縮寫搜尋功能測試"
echo "===================="
echo ""

# 檢查構建是否存在
if [ ! -d "out" ]; then
    echo "❌ 靜態構建不存在，正在構建..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ 構建失敗"
        exit 1
    fi
fi

echo "✅ 靜態構建存在"
echo ""

# 檢查資料檔案
echo "📁 檢查課程資料檔案:"
for file in "U_學士班.json" "G_碩士班.json" "D_博士班.json" "N_進修部.json" "W_在職專班.json" "O_通識加體育課.json"
do
    if [ -f "out/data/$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file 缺失"
    fi
done
echo ""

# 檢查核心檔案
echo "🔧 檢查核心檔案:"
files=("out/index.html" "out/_next/static")
for file in "${files[@]}"
do
    if [ -e "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file 缺失"
    fi
done
echo ""

# 啟動測試服務器
echo "🌐 啟動測試服務器..."
cd out
python3 -m http.server 3000 &
SERVER_PID=$!
cd ..

sleep 2

echo "✅ 服務器已啟動 (PID: $SERVER_PID)"
echo "🌐 URL: http://localhost:3000"
echo ""

echo "🧪 縮寫搜尋測試案例:"
echo "1. 搜尋 '資工' - 應顯示資訊工程相關課程"
echo "2. 搜尋 '電機' - 應顯示電機工程相關課程"
echo "3. 搜尋 '企管' - 應顯示企業管理相關課程"
echo "4. 搜尋 '中文' - 應顯示中國文學相關課程"
echo "5. 搜尋 '通識' - 應顯示通識教育相關課程"
echo ""

echo "📖 測試步驟:"
echo "1. 開啟瀏覽器前往 http://localhost:3000"
echo "2. 在搜尋框輸入縮寫（如：資工）"
echo "3. 點擊「搜尋課程」按鈕"
echo "4. 驗證搜尋結果是否正確顯示"
echo ""

echo "⏱️  測試完成後按 Ctrl+C 停止服務器"
echo ""
echo "📚 更多縮寫請參考 ABBREVIATION_SEARCH.md"

# 等待用戶中斷
wait $SERVER_PID
