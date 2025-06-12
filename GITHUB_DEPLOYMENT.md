# 🚀 GitHub 部署完整指南

## 📋 部署步驟總覽

### 1. 創建 GitHub 倉庫

1. 前往 [GitHub](https://github.com) 並登入您的帳號
2. 點擊右上角的 `+` 號，選擇 `New repository`
3. 填寫倉庫資訊：
   - **Repository name**: `Course_Selector` (或您偏好的名稱)
   - **Description**: `中興大學選課小幫手 - 自動化課程查詢與選課輔助工具`
   - 選擇 `Public` (以便使用 GitHub Pages)
   - **不要**勾選 "Add a README file"、"Add .gitignore"、"Choose a license"
4. 點擊 `Create repository`

### 2. 將本地代碼推送到 GitHub

在您的終端機中執行以下命令：

```bash
# 設置遠端倉庫 (替換 YOUR_USERNAME 為您的 GitHub 用戶名)
git remote add origin https://github.com/YOUR_USERNAME/Course_Selector.git

# 設置主分支名稱
git branch -M main

# 推送到 GitHub
git push -u origin main
```

### 3. 設置 GitHub Pages

1. 在您的 GitHub 倉庫頁面，點擊 `Settings` 標籤
2. 在左側選單中找到 `Pages`
3. 在 `Source` 部分：
   - 選擇 `Deploy from a branch`
   - Branch: 選擇 `gh-pages`
   - Folder: 選擇 `/ (root)`
4. 點擊 `Save`

**注意**: 初次設置時 `gh-pages` 分支可能還不存在，需要先執行一次 GitHub Actions 工作流程後才會出現。

### 4. 啟用 GitHub Actions 工作流程

#### 方法一：自動觸發
GitHub Actions 將會在以下時間自動執行：
- 每天台灣時間早上 6:00 (UTC 22:00)

#### 方法二：手動觸發
1. 前往您的 GitHub 倉庫
2. 點擊 `Actions` 標籤
3. 選擇 `每日課程資料更新與部署` 工作流程
4. 點擊 `Run workflow` 按鈕
5. 確認並點擊 `Run workflow`

### 5. 驗證部署結果

1. **檢查 Actions 執行狀態**:
   - 在 `Actions` 標籤中查看工作流程執行情況
   - 綠色勾號表示成功，紅色 X 表示失敗

2. **查看網站**:
   - 部署完成後，您的網站將在以下網址可用：
   - `https://YOUR_USERNAME.github.io/Course_Selector/`

3. **檢查資料更新**:
   - 查看 `course-helper-web/public/data/` 目錄中的 JSON 檔案
   - 檢查檔案的更新時間戳

## 🔧 進階設置

### 自訂域名 (可選)

如果您擁有自己的域名：

1. 在 GitHub Pages 設置中的 `Custom domain` 欄位填入您的域名
2. 在您的域名 DNS 設置中添加 CNAME 記錄指向 `YOUR_USERNAME.github.io`

### 修改更新排程

如果您想修改自動更新的時間，編輯 `.github/workflows/update-courses.yml` 中的 cron 表達式：

```yaml
schedule:
  # 每天台灣時間早上 6:00 執行（UTC 22:00）
  - cron: '0 22 * * *'
```

常用的 cron 時間設置：
- `'0 22 * * *'` - 每天 UTC 22:00 (台灣時間早上 6:00)
- `'0 14 * * *'` - 每天 UTC 14:00 (台灣時間晚上 10:00)
- `'0 */6 * * *'` - 每 6 小時執行一次

## 🐛 故障排除

### GitHub Actions 執行失敗

1. **檢查 Actions 日誌**:
   - 在 `Actions` 標籤中點擊失敗的工作流程
   - 展開每個步驟查看詳細錯誤訊息

2. **常見問題與解決方案**:

   **權限問題**:
   ```
   ERROR: Permission denied
   ```
   - 確保倉庫是 Public 或您有適當的權限
   - 檢查 GitHub token 設置

   **Python 依賴問題**:
   ```
   ERROR: ModuleNotFoundError: No module named 'requests'
   ```
   - 檢查 `.github/workflows/update-courses.yml` 中的依賴安裝步驟

   **網路連接問題**:
   ```
   ERROR: Connection timeout
   ```
   - 這通常是暫時性問題，可以手動重新執行工作流程

   **Node.js 建置問題**:
   ```
   ERROR: npm ERR! code ELIFECYCLE
   ```
   - 檢查 `course-helper-web/package.json` 中的依賴
   - 確保 Node.js 版本兼容

### GitHub Pages 無法存取

1. **檢查 Pages 設置**:
   - 確認 Source 設置為 `gh-pages` 分支
   - 確認倉庫是 Public

2. **等待部署完成**:
   - GitHub Pages 部署可能需要幾分鐘時間
   - 檢查 Actions 是否成功執行

3. **清除瀏覽器快取**:
   - 如果看到舊版本，嘗試硬重新整理 (Ctrl+F5 或 Cmd+Shift+R)

## 📊 監控與維護

### 檢查資料更新狀態

1. **透過 GitHub**:
   - 查看最新的 commit 訊息
   - 檢查 Actions 執行歷史

2. **透過網站**:
   - 在網站的「系統資訊」頁面查看更新時間
   - 檢查課程數量是否正常

### 定期維護任務

1. **每月檢查**:
   - 確認 GitHub Actions 正常執行
   - 檢查網站功能是否正常
   - 查看是否有新的依賴更新

2. **學期開始前**:
   - 確認課程資料格式是否有變更
   - 測試爬蟲程式是否正常運作
   - 更新學期參數（如果需要）

## 🆘 獲得幫助

如果您遇到問題：

1. **查看日誌**: 詳細閱讀 GitHub Actions 的執行日誌
2. **檢查文件**: 參考本專案的其他文檔
3. **提交 Issue**: 在 GitHub 倉庫中創建 Issue 描述問題
4. **聯繫開發者**: 透過 email 或其他方式聯繫

## 🎉 部署完成

恭喜！您已經成功設置了自動化的選課小幫手系統。系統將會：

- ✅ 每日自動更新課程資料
- ✅ 自動部署最新版本到 GitHub Pages
- ✅ 提供穩定可靠的選課查詢服務

享受您的自動化選課助手吧！🎓
