# LINE 圖文選單故障排除指南

## 問題描述

**症狀：** LINE 官方帳號收得到訊息，Vercel 也有接收到 webhook，但圖文選單沒有出現在 LINE 聊天室中。

**發生時間：** 2025-11-10

**影響範圍：** 正式 LINE 官方帳號

---

## 問題診斷過程

### 1. 初步檢查

✅ **ENV 設定正確**
- `LINE_CHANNEL_ACCESS_TOKEN` 設定正確
- `LINE_CHANNEL_SECRET` 設定正確
- Vercel 有成功接收到客戶傳送的 LINE 訊息

✅ **程式碼正確**
- 圖文選單設定檔存在：`richmenus/bloodPressure/menu.json`
- 圖文選單圖片存在：`richmenus/bloodPressure/image.png`
- 部署腳本存在：`scripts/richmenu.js`

✅ **測試帳號正常**
- 測試帳號的圖文選單可以正常顯示
- 使用相同的程式碼和流程

### 2. 檢查圖文選單狀態

執行指令檢查圖文選單列表：
```bash
node scripts/richmenu.js list
```

**發現：**
- ✅ 圖文選單已經建立在 LINE 伺服器上
- Rich Menu ID: `richmenu-7b99ff34278d29e018fd9acde34367c6`
- 名稱: "血壓計主選單"

### 3. 檢查預設圖文選單

執行指令檢查預設圖文選單：
```bash
node -e "const line = require('@line/bot-sdk'); require('dotenv').config(); const client = new line.Client({ channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN }); client.getDefaultRichMenuId().then(id => console.log('預設圖文選單 ID:', id)).catch(err => console.log('沒有設定預設圖文選單:', err.message));"
```

**結果：**
```
沒有設定預設圖文選單: Request failed with status code 404
```

### 4. 問題根源確認

**問題原因：圖文選單已建立，但未設定為預設圖文選單**

---

## 問題根本原因分析

### 為什麼會發生這個問題？

在 `scripts/richmenu.js` 的 `deployAll()` 函數中（第 78-95 行）：

```javascript
async function deployAll(rootDir, defaultName) {
  const subdirs = fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(rootDir, d.name));

  const created = [];
  for (const d of subdirs) {
    const result = await createFromDir(d);
    created.push(result);
  }

  const defaultItem = created.find((c) => c.name === defaultName) || created[0];
  if (defaultItem) {
    await client.setDefaultRichMenu(defaultItem.id);
    console.log('Set default rich menu:', defaultItem.name, defaultItem.id);
  }
}
```

**關鍵問題：**

1. `package.json` 中的部署指令：
   ```json
   "richmenu:deploy": "node scripts/richmenu.js deploy --dir richmenus --default bloodPressure"
   ```

2. `--default bloodPressure` 使用的是**資料夾名稱**

3. 但 `menu.json` 中的選單名稱是：
   ```json
   "name": "血壓計主選單"
   ```

4. 程式碼比對邏輯：
   ```javascript
   const defaultItem = created.find((c) => c.name === defaultName) || created[0];
   ```

   - `defaultName` = `"bloodPressure"` （資料夾名）
   - `c.name` = `"血壓計主選單"` （選單名稱）
   - **無法匹配！**

5. 雖然有 `|| created[0]` 備用邏輯，但如果執行流程不完整或被中斷，可能導致圖文選單被建立但未設定為預設。

### 為什麼測試帳號沒問題？

可能原因：
1. 測試帳號執行了完整的 `npm run richmenu:deploy` 指令
2. `|| created[0]` 備用邏輯生效，自動設定了第一個圖文選單為預設
3. 執行流程完整，沒有中斷

---

## 解決方案

### 立即修復（手動設定預設圖文選單）

```bash
node -e "const line = require('@line/bot-sdk'); require('dotenv').config(); const client = new line.Client({ channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN }); client.setDefaultRichMenu('richmenu-7b99ff34278d29e018fd9acde34367c6').then(() => console.log('✅ 成功設定預設圖文選單！')).catch(err => console.log('❌ 設定失敗:', err.message));"
```

**執行結果：**
```
✅ 成功設定預設圖文選單！
```

### 長期解決方案（修改 package.json）

將 `package.json` 中的部署指令修改為使用選單名稱而非資料夾名稱：

**修改前：**
```json
"richmenu:deploy": "node scripts/richmenu.js deploy --dir richmenus --default bloodPressure"
```

**修改後（選項 1 - 使用選單名稱）：**
```json
"richmenu:deploy": "node scripts/richmenu.js deploy --dir richmenus --default 血壓計主選單"
```

**修改後（選項 2 - 不指定 default，讓程式自動選第一個）：**
```json
"richmenu:deploy": "node scripts/richmenu.js deploy --dir richmenus"
```

---

## 標準部署流程

### 圖文選單部署流程說明

```
您的電腦 (本地)
    ↓ 執行 node scripts/richmenu.js
    ↓ 讀取 .env 中的 LINE_CHANNEL_ACCESS_TOKEN
    ↓ 使用 @line/bot-sdk
    ↓ 呼叫 LINE Messaging API
    ↓
LINE 伺服器
    ↓ 儲存圖文選單設定和圖片
    ↓ 設定為預設圖文選單
    ↓
您的官方 LINE Bot
    ✅ 圖文選單出現了！
```

### 完整部署步驟

1. **確認環境變數**
   ```bash
   # 檢查 .env 檔案
   cat .env
   ```

   確認 `LINE_CHANNEL_ACCESS_TOKEN` 是正確的官方帳號 token。

2. **刪除舊的圖文選單（可選）**
   ```bash
   npm run richmenu:delete-all
   ```

3. **查看現有圖文選單**
   ```bash
   npm run richmenu:list
   ```

4. **部署新的圖文選單**
   ```bash
   npm run richmenu:deploy
   ```

5. **驗證部署結果**
   ```bash
   npm run richmenu:list
   ```

   確認輸出中有圖文選單資料。

6. **檢查預設圖文選單**
   ```bash
   node -e "const line = require('@line/bot-sdk'); require('dotenv').config(); const client = new line.Client({ channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN }); client.getDefaultRichMenuId().then(id => console.log('預設圖文選單 ID:', id)).catch(err => console.log('錯誤:', err.message));"
   ```

7. **測試**
   - 打開 LINE 官方帳號
   - 查看聊天室下方是否出現圖文選單
   - 如果沒有，傳送一則訊息或重新開啟聊天室

---

## 常見問題 FAQ

### Q1: 為什麼圖文選單不會自動部署到 Vercel？

**A:** 圖文選單的建立是透過 LINE Messaging API，需要在**本地電腦**執行腳本來呼叫 API。Vercel 只負責處理 webhook（接收 LINE 訊息），不會自動執行圖文選單部署。

### Q2: 我修改了圖文選單內容，需要重新部署嗎？

**A:** 是的。修改 `menu.json` 或 `image.png` 後，需要：
1. 刪除舊的圖文選單：`npm run richmenu:delete-all`
2. 重新部署：`npm run richmenu:deploy`

### Q3: 如何確認圖文選單已經部署成功？

**A:** 執行以下檢查：
1. `npm run richmenu:list` - 應該顯示圖文選單資料
2. 檢查預設圖文選單 - 應該返回 Rich Menu ID
3. 在 LINE 聊天室中查看 - 應該看到圖文選單

### Q4: 圖文選單出現了但點擊沒反應？

**A:** 檢查以下項目：
1. `menu.json` 中的 `action.data` 是否正確
2. `index.js` 中的 `handlePostback()` 函數是否有處理對應的 data
3. Vercel logs 是否有錯誤訊息

### Q5: 測試帳號和正式帳號如何切換？

**A:** 修改本地 `.env` 檔案中的 `LINE_CHANNEL_ACCESS_TOKEN` 和 `LINE_CHANNEL_SECRET`，然後重新執行部署指令。

**注意：** Vercel 上的環境變數和本地 `.env` 是分開的！
- **本地 `.env`**: 用於執行圖文選單部署腳本
- **Vercel ENV**: 用於處理 webhook（接收訊息）

---

## 檢查清單

部署圖文選單前，請確認：

- [ ] `.env` 檔案中的 `LINE_CHANNEL_ACCESS_TOKEN` 是正確的
- [ ] `richmenus/bloodPressure/menu.json` 設定正確
- [ ] `richmenus/bloodPressure/image.png` 存在且小於 1MB
- [ ] 圖片尺寸符合 `menu.json` 中的設定（2500x1686）
- [ ] 執行 `npm run richmenu:deploy` 完整無錯誤
- [ ] 執行 `npm run richmenu:list` 確認圖文選單已建立
- [ ] 檢查預設圖文選單已設定
- [ ] 在 LINE 聊天室中測試圖文選單功能

---

## 相關檔案

- `richmenus/bloodPressure/menu.json` - 圖文選單設定
- `richmenus/bloodPressure/image.png` - 圖文選單圖片
- `scripts/richmenu.js` - 圖文選單部署腳本
- `package.json` - npm 指令設定
- `.env` - 環境變數（本地）
- Vercel Dashboard - 環境變數（線上）

---

## 技術支援

如果遇到問題，請依序檢查：

1. **查看錯誤訊息**
   ```bash
   npm run richmenu:deploy
   ```

2. **檢查 LINE Channel Token 權限**
   - 登入 LINE Developers Console
   - 確認 Channel Access Token 有效
   - 確認有 Messaging API 權限

3. **檢查圖片規格**
   - 檔案格式：PNG 或 JPG
   - 檔案大小：< 1MB
   - 圖片尺寸：符合 menu.json 設定

4. **查看 Vercel Logs**
   - 確認 webhook 是否正常接收
   - 確認 postback 處理是否有錯誤

---

**文件建立日期：** 2025-11-10
**最後更新：** 2025-11-10
**問題狀態：** ✅ 已解決
