#!/bin/bash

# 🧪 課程爬蟲測試腳本
# 用於驗證爬蟲程式是否正常運作

echo "🧪 課程爬蟲測試開始..."
echo "=========================="

# 檢查 Python 環境
echo "🐍 檢查 Python 環境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安裝"
    exit 1
fi

echo "✅ Python 版本: $(python3 --version)"

# 檢查依賴
echo ""
echo "📦 檢查依賴套件..."
if ! python3 -c "import requests" 2>/dev/null; then
    echo "⚠️  requests 套件未安裝，正在安裝..."
    pip3 install requests
    if [ $? -ne 0 ]; then
        echo "❌ 安裝 requests 失敗"
        exit 1
    fi
fi

echo "✅ 依賴套件完整"

# 檢查資料目錄
echo ""
echo "📁 檢查資料目錄..."
if [ ! -d "course-helper-web/public/data" ]; then
    echo "📁 創建資料目錄..."
    mkdir -p course-helper-web/public/data
fi

echo "✅ 資料目錄準備完成"

# 下載網站憑證提供
openssl s_client -showcerts -connect onepiece.nchu.edu.tw:443 </dev/null \
| awk '/BEGIN/,/END/{ if(/BEGIN/){a++}; out="nchu_cert"a".pem"; print >out }'
cat nchu_cert1.pem nchu_cert2.pem > nchu_fullchain.pem # 合併伺服器憑證和中繼憑證
rm nchu_cert*

# 執行爬蟲程式
echo ""
echo "🕷️  執行課程爬蟲..."
echo "⚠️  這可能需要幾分鐘時間，請耐心等待..."
echo ""

if python3 course_crawler.py; then
    echo ""
    echo "✅ 爬蟲執行成功！"
    
    # 檢查產生的檔案
    echo ""
    echo "📊 檢查產生的資料檔案："
    for file in course-helper-web/public/data/*.json; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            filesize=$(du -h "$file" | cut -f1)
            echo "  ✅ $filename ($filesize)"
        fi
    done
    
    # 統計總課程數
    echo ""
    echo "📈 課程資料統計："
    total_courses=0
    for file in course-helper-web/public/data/*.json; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            # 嘗試計算課程數量 (簡單的 JSON 解析)
            count=$(python3 -c "
import json
try:
    with open('$file', 'r', encoding='utf-8') as f:
        data = json.load(f)
        course_count = len(data.get('course', []))
        print(f'  {course_count}', end='')
        total = $total_courses + course_count
        print(f'  {total}', end='')
except:
    print('  無法解析', end='')
" 2>/dev/null)
            if [ -n "$count" ]; then
                course_count=$(echo "$count" | awk '{print $1}')
                total_courses=$(echo "$count" | awk '{print $2}')
                echo "  📚 $filename: $course_count 門課程"
            else
                echo "  ⚠️  $filename: 無法解析"
            fi
        fi
    done
    
    echo ""
    echo "🎯 總計: $total_courses 門課程"
    
else
    echo ""
    echo "❌ 爬蟲執行失敗！"
    echo ""
    echo "🔍 可能的原因："
    echo "  • 網路連線問題"
    echo "  • 目標網站暫時無法存取"
    echo "  • 網站結構發生變化"
    echo "  • Python 套件版本不相容"
    echo ""
    echo "💡 建議解決方案："
    echo "  • 檢查網路連線"
    echo "  • 稍後重新執行"
    echo "  • 查看詳細錯誤訊息"
    exit 1
fi

echo ""
echo "🎉 測試完成！"
echo "=========================="
echo ""
echo "📁 資料位置: course-helper-web/public/data/"
echo "🌐 接下來可以建置前端網站測試："
echo "   cd course-helper-web"
echo "   npm install"
echo "   npm run build"
echo "   npm run preview"
