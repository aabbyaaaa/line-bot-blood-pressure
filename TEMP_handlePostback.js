module.exports = app;
const express = require("express");
const line = require("@line/bot-sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

// LINE Bot 設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// 處理 LINE Webhook
app.post("/webhook", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// 處理各種事件
async function handleEvent(event) {
  if (event.type !== "message" && event.type !== "postback") {
    return Promise.resolve(null);
  }

  let replyMessage;

  if (event.type === "postback") {
    // 處理圖文選單點擊
    replyMessage = handlePostback(event.postback.data);
  } else if (event.type === "message" && event.message.type === "text") {
    // 處理文字訊息
    replyMessage = handleTextMessage(event.message.text);
  }

  if (replyMessage) {
    return client.replyMessage(event.replyToken, replyMessage);
  }
}

// 處理 Postback 事件
