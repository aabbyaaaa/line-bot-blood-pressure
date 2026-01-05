# 多頁籤圖文選單部署說明

## 🎯 功能概述

本專案實作了**多頁籤圖文選單系統**，使用者可以透過上方的 Tab 切換不同的圖文選單：

- 📍 **血壓計** Tab → bloodPressure 選單
- 📍 **血糖機** Tab → bloodSugar 選單
- 📍 **vitamix E320** Tab → VITAMIX 選單

## 📋 選單配置

### Tab 區域配置（所有選單共用）
```
血壓計 Tab:     x=0,    y=0, width=833,  height=235
血糖機 Tab:     x=833,  y=0, width=834,  height=235
vitamix Tab:    x=1667, y=0, width=833,  height=235
```

### 內容區域
- 起始 y 座標：235
- 高度：1451 (1686 - 235)

---

## 🚀 部署步驟

### 步驟 1: 部署所有圖文選單

**重要**：必須同時部署 3 個選單，才能讓切換功能正常運作。

```bash
node scripts/richmenu.js deploy --dir richmenus --default bloodPressure
```

這個指令會：
1. 上傳 bloodPressure、bloodSugar、VITAMIX 三個選單到 LINE 伺服器
2. 將 bloodPressure 設定為預設選單（新使用者會先看到這個）
3. 自動取得並快取所有選單的 ID

### 步驟 2: 推送到 Vercel 部署

```bash
git add .
git commit -m "Add multi-tab rich menu system"
git push
```

Vercel 會自動部署新版本。

### 步驟 3: 驗證部署

1. **檢查圖文選單是否上傳成功**：
   ```bash
   node scripts/richmenu.js list
   ```
   應該會看到 3 個選單的資訊

2. **測試切換功能**：
   - 開啟 LINE 聊天室
   - 點擊不同的 Tab
   - 確認選單有正確切換

---

## 📂 檔案結構

```
line-bot-blood-pressure-rtm/
├── handlers/
│   ├── bloodPressure.js          # 血壓計處理邏輯
│   ├── bloodSugar.js              # 血糖機處理邏輯
│   ├── vitamix.js                 # VITAMIX 處理邏輯
│   └── richMenuSwitcher.js        # 圖文選單切換邏輯 ⭐ 新增
├── richmenus/
│   ├── bloodPressure/
│   │   ├── menu.json              # ✅ 已加入 Tab 區域
│   │   └── image.png
│   ├── bloodSugar/
│   │   ├── menu.json              # ✅ 已加入 Tab 區域
│   │   ├── image.png
│   │   └── flex_info.json
│   └── VITAMIX/
│       ├── menu.json              # ✅ 已加入 Tab 區域
│       ├── image.png
│       └── flex_info.json
└── index.js                       # ✅ 已整合切換功能
```

---

## 🔧 技術實作細節

### 圖文選單切換機制

#### 1. Tab 點擊觸發 postback
```json
{
  "action": {
    "type": "postback",
    "data": "action=switch_to_bloodPressure"
  }
}
```

#### 2. index.js 處理切換請求
```javascript
if (data === "action=switch_to_bloodPressure") {
  await richMenuSwitcher.switchRichMenu(event.source.userId, "bloodPressure");
  return Promise.resolve(null); // 不回傳訊息
}
```

#### 3. richMenuSwitcher 執行切換
```javascript
await client.linkRichMenuToUser(userId, richMenuId);
```

### 選單 ID 快取機制

系統會在啟動時自動取得所有選單的 ID：
```javascript
// handlers/richMenuSwitcher.js
fetchRichMenuIds(); // 初始化時執行
```

如果需要手動更新快取：
```javascript
richMenuSwitcher.fetchRichMenuIds();
```

---

## 🎨 選單內容

### bloodPressure（血壓計選單）
- **上方 Tab 區域**：3 個切換按鈕
- **中間區域**：體脂計加購優惠
- **下方 3 格**：
  - 血壓計分類
  - 血壓計活動
  - 為什麼血壓計要跟德記生活買

### bloodSugar（血糖機選單）
- **上方 Tab 區域**：3 個切換按鈕
- **下方內容**：血糖資訊（點擊後顯示多頁輪播訊息）

### VITAMIX
- **上方 Tab 區域**：3 個切換按鈕
- **左側**：超連結到 VITAMIX 商品頁
- **右側**：VITAMIX 資訊（點擊後顯示多頁輪播訊息）

---

## ⚙️ 環境變數

確保 `.env` 和 Vercel 環境變數都已設定：

```
LINE_CHANNEL_SECRET=你的Channel Secret
LINE_CHANNEL_ACCESS_TOKEN=你的Channel Access Token
PORT=3000
```

---

## 🔍 疑難排解

### 問題 1: 點擊 Tab 後選單沒有切換

**原因**：圖文選單可能沒有成功部署到 LINE 伺服器

**解決方法**：
```bash
# 檢查是否有 3 個選單
node scripts/richmenu.js list

# 重新部署
node scripts/richmenu.js deploy --dir richmenus --default bloodPressure
```

### 問題 2: 出現「Rich menu ID not found」錯誤

**原因**：選單 ID 快取失敗或選單名稱不符

**解決方法**：
1. 檢查 menu.json 中的 `name` 欄位是否正確：
   - bloodPressure: `"name": "血壓計主選單"`
   - bloodSugar: `"name": "bloodSugar"`
   - VITAMIX: `"name": "VITAMIX"`

2. 重新啟動伺服器讓快取更新

### 問題 3: 新使用者看不到圖文選單

**原因**：沒有設定預設選單

**解決方法**：
```bash
node scripts/richmenu.js deploy --dir richmenus --default bloodPressure
```

### 問題 4: 切換後有延遲

**原因**：這是正常的，LINE API 切換選單需要一點時間（通常 1-2 秒）

**解決方法**：無需處理，使用者體驗是可接受的

---

## 🚨 重要提醒

1. **不要刪除任何一個選單**
   - 三個選單必須同時存在
   - 刪除任何一個會導致切換功能失效

2. **更新選單時要重新部署**
   - 修改 menu.json 後要執行 deploy
   - 修改圖片後也要重新部署

3. **不要用後台設定圖文選單**
   - 使用後台會覆蓋程式設定
   - 切換功能會失效

---

## 📊 切換邏輯流程圖

```
使用者點擊 Tab
    ↓
觸發 postback (action=switch_to_xxx)
    ↓
index.js handleEvent 接收
    ↓
調用 richMenuSwitcher.switchRichMenu()
    ↓
使用 client.linkRichMenuToUser()
    ↓
LINE 伺服器更新使用者的圖文選單
    ↓
使用者看到新的選單
```

---

## 📞 相關資源

- [LINE Messaging API - Rich Menu](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/)
- [圖文選單管理說明](README_RICHMENU.md)
- [疑難排解指南](README_RICHMENU_TROUBLESHOOTING.md)
- [部署設定資料](部署設定資料.md)

---

## 🎯 下一步

如果要新增更多選單或修改內容：

1. 修改對應的 `menu.json`（記得保留 Tab 區域）
2. 更新 `flex_info.json` 中的輪播訊息內容
3. 重新部署：`node scripts/richmenu.js deploy --dir richmenus --default bloodPressure`
4. 推送到 Vercel：`git push`

完成！🎉
