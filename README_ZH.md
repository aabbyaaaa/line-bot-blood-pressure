LINE Bot — 血壓諮詢助理（繁中）

這是一個用 Node.js + Express 建置的 LINE 官方帳號後端，協助使用者了解並諮詢血壓計相關產品與優惠。透過 LINE Messaging API 回覆文字與 postback 事件，並以 Flex Message 呈現商品卡與 Carousel。

重點功能
- Webhook 處理 LINE 事件（`message:text`、`postback`）。
- Quick Reply 與按鈕引導使用者選擇產品類別。
- Flex Message 富卡片/走馬燈展示商品與促案。
- `GET /` 健康檢查端點，方便監控上線狀態。
- 內建 Vercel 部署設定。

技術組成
- Node.js、Express
- @line/bot-sdk
- dotenv（環境變數）

專案結構
- `index.js`：主程式、Webhook 路由、事件分流、Flex 產生。
- `flex_*.json`：Flex 模板（商品卡/Carousel）。
- `vercel.json`：Vercel 無伺服器設定。

環境變數
請在專案根目錄建立 `.env`（勿提交到 Git）：

LINE_CHANNEL_ACCESS_TOKEN=你的 LINE Channel Access Token
LINE_CHANNEL_SECRET=你的 LINE Channel Secret
PORT=3000

本機開發
1) 安裝套件：
   npm install
2) 啟動服務：
   npm start
3) 曝露 Webhook：
   使用 ngrok 或 cloudflared 將本機連到公網，並在 LINE Console 設定 Webhook URL 為 `https://<public-url>/webhook`。

部署（Vercel）
- 已含 `vercel.json`，使用 @vercel/node 執行 `index.js`。
- 請在 Vercel 專案設定中填入環境變數。
- 在 LINE Console 將 Webhook 指向你的 Vercel 網址 `/webhook`。

API 端點
- POST `/webhook`：LINE Messaging API Webhook 端點。
- GET `/`：健康檢查，回傳 `LINE Bot is running!`。

注意事項
- 目前大量 Flex 內容仍內嵌於 `index.js`，部分模板另存於 `flex_*.json`。建議後續全面外部化並以模組載入，以利維護。
- 目前處理 `message:text` 與 `postback` 事件，建議新增 `follow` 事件以提供歡迎訊息與導覽。

授權
ISC

相關文件
- 英文版說明：`README_EN.md`
