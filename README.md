# 中興大學選課小幫手 🎓

## ✨ 特色功能

- 🔍 **進階搜尋**: 支援關鍵字、系所、教師、學分數搜尋
    - 採用前端索引式搜尋引擎 (`search-engine.ts`)，整合系所縮寫/全名映射
- 📅 **課表預覽**: 即時課表預覽和衝堂檢查  
- 🤖 **自動更新**: 透過 GitHub Actions 每日爬蟲 + 部署（純靜態 JSON + 前端本地快取）

## 🚀 線上使用

網站每日由 GitHub Actions 爬取並重新部署（若資料有變更才提交），前端使用 localStorage 版本化快取減少重複載入：

**🌐 [立即使用選課小幫手](https://ericyang801.github.io/NCHU_Course_Selector/)**

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
    - 縮寫/別名自動展開（例如「資工」= 資訊工程學系、「應數」= 應用數學系）

## 📊 資料更新機制

- **排程時間**: 每天台灣時間 06:00（GitHub Actions cron）
- **資料來源**: 中興大學課程查詢系統
- **更新策略**: 若 JSON 有差異才 commit + 部署；前端以 `COURSE_DATA_VERSION` 控制本地快取失效
- **涵蓋範圍**: 學士班 / 碩士班 / 博士班 / 進修部 / 在職專班 / 通識與體育

## 🛠️ 技術架構

### 前端網站
- **框架**: Next.js 15 + React 19
- **樣式**: Tailwind CSS
- **語言**: TypeScript
- **部署**: GitHub Pages (靜態網站)

### 資料爬取
- **語言**: Python 3.11 (`course_crawler.py`)
- **自動化**: GitHub Actions（`update-courses.yml`）
- **快取策略**: 前端 localStorage + `COURSE_DATA_VERSION`

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

- 本工具僅供參考，實際選課請以學校教務系統為準

## 📞 聯絡資訊

如有問題或建議，歡迎透過以下方式聯繫：

- 🐛 Issue: [GitHub Issues](https://github.com/EricYang801/NCHU_Course_Selector/issues)

---

**🎓 祝您選課順利！**
