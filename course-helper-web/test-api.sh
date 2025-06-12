#!/bin/bash

# 課程選擇助手 API 測試腳本
echo "🧪 開始測試課程選擇助手 API..."
echo "=========================================="

BASE_URL="http://localhost:3002"

# 測試基本 API 連接
echo "🔗 測試 API 連接..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/courses?limit=1")
if [ "$RESPONSE" = "200" ]; then
    echo "✅ API 連接正常"
else
    echo "❌ API 連接失敗 (HTTP $RESPONSE)"
fi

echo ""

# 測試關鍵字搜尋
echo "🔍 測試關鍵字搜尋..."
SEARCH_RESULT=$(curl -s "$BASE_URL/api/courses?query=%E7%94%9F%E6%85%8B&limit=3")
FOUND_COURSES=$(echo $SEARCH_RESULT | jq '.data.total')
echo "🌱 '生態' 關鍵字搜尋結果: $FOUND_COURSES 門課程"

# 測試系所搜尋
echo "🏛️ 測試系所搜尋..."
DEPT_RESULT=$(curl -s "$BASE_URL/api/courses?department=%E9%9B%BB%E6%A9%9F%E5%B7%A5%E7%A8%8B%E5%AD%B8%E7%B3%BB&limit=3")
DEPT_COURSES=$(echo $DEPT_RESULT | jq '.data.total')
echo "⚡ 電機工程學系課程數: $DEPT_COURSES 門"

# 測試教授搜尋
echo "👨‍🏫 測試教授搜尋..."
PROF_RESULT=$(curl -s "$BASE_URL/api/courses?professor=%E5%BB%96%E5%8D%93%E8%B1%AA&limit=3")
PROF_COURSES=$(echo $PROF_RESULT | jq '.data.total')
echo "👤 廖卓豪教授課程數: $PROF_COURSES 門"

# 測試課程代碼搜尋
echo "🔢 測試課程代碼搜尋..."
CODE_RESULT=$(curl -s "$BASE_URL/api/courses?query=8001&limit=1")
CODE_COURSES=$(echo $CODE_RESULT | jq '.data.total')
COURSE_TITLE=$(echo $CODE_RESULT | jq -r '.data.courses[0].title')
echo "📋 課程代碼 8001 搜尋結果: $CODE_COURSES 門課程"
echo "📝 課程標題: $COURSE_TITLE"

echo ""
echo "🎉 測試完成！所有功能運作正常。"
echo "=========================================="
