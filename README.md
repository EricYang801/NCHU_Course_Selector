# 中興大學選課小幫手 🎓

一個自動化的選課輔助工具，提供中興大學學生快速搜尋和瀏覽課程資訊的服務。

## ✨ 特色功能

- 🔍 **智能搜尋**: 支援關鍵字、系所、教師、學分數搜尋
- 📅 **課表預覽**: 即時課表預覽和衝堂檢查  
- 🤖 **自動更新**: 每日自動抓取最新課程資料
- 📱 **響應式設計**: 支援電腦和手機瀏覽
- ⚡ **快速載入**: 靜態網站，無需等待伺服器回應

## 🚀 線上使用

網站會每天自動更新課程資料，您可以直接使用：

**🌐 [立即使用選課小幫手](https://your-username.github.io/Course_Selector/)**

## 📊 資料更新機制

- **更新時間**: 每天台灣時間早上 6:00 自動執行
- **資料來源**: 中興大學課程查詢系統
- **更新範圍**: 
  - 學士班課程
  - 碩士班課程
  - 博士班課程
  - 進修部課程
  - 在職專班課程
  - 通識及體育課程

## 🛠️ 技術架構

### 前端網站
- **框架**: Next.js 15 + React 19
- **樣式**: Tailwind CSS
- **語言**: TypeScript
- **部署**: GitHub Pages (靜態網站)

### 資料爬取
- **語言**: Python 3.11
- **自動化**: GitHub Actions
- **排程**: Cron (每日執行)

## 📁 專案結構

```
Course_Selector/
├── course_crawler.py           # Python 爬蟲程式
├── .github/workflows/          # GitHub Actions 設定
│   └── update-courses.yml      # 自動更新工作流程
└── course-helper-web/          # 前端網站
    ├── public/data/            # 課程 JSON 資料
    ├── src/                    # 原始碼
    └── out/                    # 建置輸出 (自動生成)
```

## 🔧 本地開發

### 前置需求
- Node.js 18+
- npm 或 yarn
- Python 3.11+ (僅用於資料爬取)

### 安裝與執行

```bash
# 1. 克隆專案
git clone https://github.com/your-username/Course_Selector.git
cd Course_Selector

# 2. 安裝前端依賴
cd course-helper-web
npm install

# 3. 開發模式執行
npm run dev

# 4. 建置靜態版本
npm run build
```

### 手動更新課程資料

```bash
# 回到專案根目錄
cd ..

# 安裝 Python 依賴
pip install requests

# 執行爬蟲
python course_crawler.py
```

## 📋 GitHub Actions 工作流程

每日自動執行以下步驟：

1. **檢出程式碼**: 獲取最新的倉庫內容
2. **設置環境**: 配置 Python 和 Node.js 環境
3. **執行爬蟲**: 抓取最新課程資料
4. **檢查變更**: 確認資料是否有更新
5. **建置網站**: 生成靜態網站檔案
6. **提交變更**: 將新資料提交到倉庫
7. **部署網站**: 更新 GitHub Pages

## 🎯 使用方式

1. **搜尋課程**: 在搜尋框輸入關鍵字（課程名稱、教師、系所等）
2. **篩選條件**: 使用下拉選單篩選系所、學制、學分數等
3. **加入課表**: 點擊「加入課表」按鈕將課程加入個人課表
4. **檢視課表**: 右側即時顯示課表並自動檢查衝堂
5. **移除課程**: 在課表中點擊課程可移除

## 📚 支援的搜尋功能

- **關鍵字搜尋**: 課程名稱、教師姓名
- **系所篩選**: 依開課系所分類
- **學制篩選**: 學士班、碩士班、博士班等
- **學分篩選**: 依學分數篩選
- **時間篩選**: 依上課時間篩選

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📜 授權條款

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## ⚠️ 免責聲明

- 本工具僅供參考，實際選課請以學校官方系統為準
- 課程資料來源為公開資訊，如有異議請聯繫開發者
- 開發者不對使用本工具所產生的任何後果負責

## 📞 聯絡資訊

如有問題或建議，歡迎透過以下方式聯繫：

- 📧 Email: [your-email@example.com]
- 🐛 Issue: [GitHub Issues](https://github.com/your-username/Course_Selector/issues)

---

**🎓 祝您選課順利！**
