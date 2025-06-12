# 中興大學選課小幫手 - 靜態版本部署指南

## 概述

此版本已經改寫為純靜態網站，可以部署到任何靜態網站託管服務上，如 GitHub Pages、Netlify、Vercel 等。

## 主要變更

### 從動態網站轉為靜態網站的變更：

1. **移除服務器端功能**
   - 刪除 `/src/app/api` 目錄下的所有 API 路由
   - 刪除 `/scripts` 目錄下的服務器端腳本
   - 移除爬蟲和排程功能

2. **客戶端資料載入**
   - 創建 `/src/lib/course-service.ts` 來處理客戶端資料載入
   - 所有課程資料從 `/public/data/` 目錄載入
   - 支援關鍵字搜尋、篩選和分頁功能

3. **Next.js 靜態導出配置**
   - 修改 `next.config.ts` 啟用靜態導出
   - 設置 `output: 'export'` 和相關配置

4. **介面調整**
   - 將「系統管理」改為「系統資訊」頁面
   - 顯示課程統計資料而非管理功能
   - 保持原有的搜尋和課表預覽功能

## 建置和部署

### 本地開發

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 本地預覽生產版本
npm run build
cd out
python3 -m http.server 3000
```

### 建置靜態版本

```bash
# 建置靜態文件
npm run build
```

建置完成後，所有靜態文件會在 `out` 目錄中。

### 部署選項

#### 1. GitHub Pages

1. 將 `out` 目錄內容推送到 GitHub repository
2. 在 repository 設定中啟用 GitHub Pages
3. 選擇 source 為該分支

#### 2. Netlify

1. 直接拖拽 `out` 目錄到 Netlify 部署頁面
2. 或連接 GitHub repository 並設置建置命令：
   ```
   Build command: npm run build
   Publish directory: out
   ```

#### 3. Vercel

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
cd out
vercel --name course-helper-static
```

#### 4. 其他靜態託管服務

將 `out` 目錄中的所有文件上傳到任何支援靜態網站的託管服務。

## 資料說明

### 課程資料結構

- `public/data/U_學士班.json` - 學士班課程
- `public/data/G_碩士班.json` - 碩士班課程  
- `public/data/D_博士班.json` - 博士班課程
- `public/data/N_進修部.json` - 進修部課程
- `public/data/W_在職專班.json` - 在職專班課程
- `public/data/O_通識加體育課.json` - 通識和體育課程

### 資料更新

由於這是靜態版本，資料更新需要：

1. 使用原始的 Python 爬蟲腳本更新 JSON 檔案
2. 將新的 JSON 檔案放入 `public/data/` 目錄
3. 重新建置和部署靜態網站

## 功能特色

- ✅ 完整的課程搜尋功能（關鍵字、系所、學制、教師、學分、時間）
- ✅ 即時課表預覽和衝堂檢查
- ✅ 本地存儲已選課程
- ✅ 響應式設計，支援手機和電腦
- ✅ 快速載入，無需服務器
- ✅ 可離線使用（資料載入後）

## 技術架構

- **前端框架**: Next.js 15 with App Router
- **UI 樣式**: Tailwind CSS
- **語言**: TypeScript
- **資料格式**: JSON
- **部署**: 靜態檔案

## 版本資訊

- **版本**: 靜態版本 1.0
- **建置時間**: 2025-06-12
- **課程資料**: 中興大學 113 學年度課程
