const express = require("express");
const line = require("@line/bot-sdk");
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
function handlePostback(data) {
  console.log("Postback data:", data);

  switch (data) {
    case "action=add_on_scale":
      // 上方區塊：體脂計加購
      return getFlexMessage();

    case "action=bp_categories":
      // 左下：血壓計分類 - 回傳 Quick Reply
      return {
        type: "text",
        text: "請選擇您想了解的血壓計類型：",
        quickReply: {
          items: [
            {
              type: "action",
              action: {
                type: "postback",
                label: "手腕式血壓計",
                data: "category=wrist_bp",
                displayText: "手腕式血壓計",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "手臂式血壓計",
                data: "category=arm_bp",
                displayText: "手臂式血壓計",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "藍牙血壓計",
                data: "category=bluetooth_bp",
                displayText: "藍牙血壓計",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "歐姆龍血壓計ZZZ",
                data: "category=omron_bp",
                displayText: "歐姆龍血壓計",
              },
            },
          ],
        },
      };

    case "action=current_offers":
      // 中下：現在優惠
      return getFlexMessage();

    case "action=why_choose_us":
      // 右下：選擇德記
      return getFlexMessage();

    // 處理 Quick Reply 的選擇
    case "category=wrist_bp":
    case "category=arm_bp":
    case "category=bluetooth_bp":
    case "category=omron_bp":
      return getFlexMessage();

    default:
      return { type: "text", text: "感謝您的查詢！" };
  }
}

// 處理文字訊息
function handleTextMessage(text) {
  switch (text.trim()) {
    case "體脂計加購":
      return handlePostback("action=add_on_scale");
    case "血壓計分類":
      return handlePostback("action=bp_categories");
    case "現在優惠":
      return handlePostback("action=current_offers");
    case "選擇德記":
      return handlePostback("action=why_choose_us");
    default:
      return { type: "text", text: `您說：${text}` };
  }
}
// 取得 Flex Message（使用你提供的 JSON）
function getFlexMessage() {
  return {
    type: "flex",
    altText: "商品資訊",
    contents: {
      type: "carousel",
      contents: [
        {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "image",
                url: "https://cdn.shopify.com/s/files/1/0204/3327/2854/files/1-01.jpg?v=1755923553",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "2:3",
                gravity: "top",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "BC-760七合一體組成計XXXXXXXXXX",
                        size: "xl",
                        color: "#ffffff",
                        weight: "bold",
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {
                        type: "text",
                        text: "$,780",
                        color: "#ebebeb",
                        size: "xxl",
                        flex: 0,
                      },
                      {
                        type: "text",
                        text: "$1,780",
                        color: "#ffffffcc",
                        decoration: "line-through",
                        gravity: "bottom",
                        flex: 0,
                        size: "sm",
                      },
                    ],
                    spacing: "lg",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "filler",
                      },
                      {
                        type: "box",
                        layout: "baseline",
                        contents: [
                          {
                            type: "filler",
                          },
                          {
                            type: "icon",
                            url: "https://developers-resource.landpress.line.me/fx/clip/clip14.png",
                          },
                          {
                            type: "filler",
                          },
                          {
                            type: "text",
                            text: "我要加購",
                            color: "#ffffff",
                            align: "start",
                            flex: 0,
                            offsetTop: "-2px",
                            offsetStart: "-80px",
                          },
                        ],
                        spacing: "sm",
                      },
                      {
                        type: "filler",
                      },
                    ],
                    borderWidth: "1px",
                    cornerRadius: "4px",
                    spacing: "sm",
                    borderColor: "#ffffff",
                    margin: "xxl",
                    height: "40px",
                    action: {
                      type: "message",
                      label: "action",
                      text: "⏰ 目前為下班時段（客服離線），我們會在上班時間依序回覆／協助下單。 也可先點「看活動辦法」或「體脂計清單」了解品項與價格喔～XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                    },
                  },
                ],
                position: "absolute",
                offsetBottom: "0px",
                offsetStart: "0px",
                offsetEnd: "0px",
                backgroundColor: "#03303Acc",
                paddingAll: "20px",
                paddingTop: "18px",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "SALE",
                    color: "#ffffff",
                    align: "center",
                    size: "xs",
                    offsetTop: "3px",
                  },
                ],
                position: "absolute",
                cornerRadius: "20px",
                offsetTop: "18px",
                backgroundColor: "#ff334b",
                offsetStart: "18px",
                height: "25px",
                width: "53px",
              },
            ],
            paddingAll: "0px",
          },
        },
        {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "image",
                url: "https://cdn.shopify.com/s/files/1/0204/3327/2854/files/1-01.jpg?v=1755923553",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "2:3",
                gravity: "top",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "BC-760七合一體組成計",
                        size: "xl",
                        color: "#ffffff",
                        weight: "bold",
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {
                        type: "text",
                        text: "$,780",
                        color: "#ebebeb",
                        size: "xxl",
                        flex: 0,
                      },
                      {
                        type: "text",
                        text: "$1,780",
                        color: "#ffffffcc",
                        decoration: "line-through",
                        gravity: "bottom",
                        flex: 0,
                        size: "sm",
                      },
                    ],
                    spacing: "lg",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "filler",
                      },
                      {
                        type: "box",
                        layout: "baseline",
                        contents: [
                          {
                            type: "filler",
                          },
                          {
                            type: "icon",
                            url: "https://developers-resource.landpress.line.me/fx/clip/clip14.png",
                          },
                          {
                            type: "filler",
                          },
                          {
                            type: "text",
                            text: "我要加購",
                            color: "#ffffff",
                            align: "start",
                            flex: 0,
                            offsetTop: "-2px",
                            offsetStart: "-80px",
                          },
                        ],
                        spacing: "sm",
                      },
                      {
                        type: "filler",
                      },
                    ],
                    borderWidth: "1px",
                    cornerRadius: "4px",
                    spacing: "sm",
                    borderColor: "#ffffff",
                    margin: "xxl",
                    height: "40px",
                    action: {
                      type: "message",
                      label: "action",
                      text: "⏰ 目前為下班時段（客服離線），我們會在上班時間依序回覆／協助下單。 也可先點「看活動辦法」或「體脂計清單」了解品項與價格喔～",
                    },
                  },
                ],
                position: "absolute",
                offsetBottom: "0px",
                offsetStart: "0px",
                offsetEnd: "0px",
                backgroundColor: "#03303Acc",
                paddingAll: "20px",
                paddingTop: "18px",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "SALE",
                    color: "#ffffff",
                    align: "center",
                    size: "xs",
                    offsetTop: "3px",
                  },
                ],
                position: "absolute",
                cornerRadius: "20px",
                offsetTop: "18px",
                backgroundColor: "#ff334b",
                offsetStart: "18px",
                height: "25px",
                width: "53px",
              },
            ],
            paddingAll: "0px",
          },
        },
        {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "image",
                url: "https://cdn.shopify.com/s/files/1/0204/3327/2854/files/1-01.jpg?v=1755923553",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "2:3",
                gravity: "top",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "BC-760七合一體組成計",
                        size: "xl",
                        color: "#ffffff",
                        weight: "bold",
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {
                        type: "text",
                        text: "$,780",
                        color: "#ebebeb",
                        size: "xxl",
                        flex: 0,
                      },
                      {
                        type: "text",
                        text: "$1,780",
                        color: "#ffffffcc",
                        decoration: "line-through",
                        gravity: "bottom",
                        flex: 0,
                        size: "sm",
                      },
                    ],
                    spacing: "lg",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "filler",
                      },
                      {
                        type: "box",
                        layout: "baseline",
                        contents: [
                          {
                            type: "filler",
                          },
                          {
                            type: "icon",
                            url: "https://developers-resource.landpress.line.me/fx/clip/clip14.png",
                          },
                          {
                            type: "filler",
                          },
                          {
                            type: "text",
                            text: "我要加購",
                            color: "#ffffff",
                            align: "start",
                            flex: 0,
                            offsetTop: "-2px",
                            offsetStart: "-80px",
                          },
                        ],
                        spacing: "sm",
                      },
                      {
                        type: "filler",
                      },
                    ],
                    borderWidth: "1px",
                    cornerRadius: "4px",
                    spacing: "sm",
                    borderColor: "#ffffff",
                    margin: "xxl",
                    height: "40px",
                    action: {
                      type: "message",
                      label: "action",
                      text: "⏰ 目前為下班時段（客服離線），我們會在上班時間依序回覆／協助下單。 也可先點「看活動辦法」或「體脂計清單」了解品項與價格喔～",
                    },
                  },
                ],
                position: "absolute",
                offsetBottom: "0px",
                offsetStart: "0px",
                offsetEnd: "0px",
                backgroundColor: "#03303Acc",
                paddingAll: "20px",
                paddingTop: "18px",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "SALE",
                    color: "#ffffff",
                    align: "center",
                    size: "xs",
                    offsetTop: "3px",
                  },
                ],
                position: "absolute",
                cornerRadius: "20px",
                offsetTop: "18px",
                backgroundColor: "#ff334b",
                offsetStart: "18px",
                height: "25px",
                width: "53px",
              },
            ],
            paddingAll: "0px",
          },
        },
      ],
    },
  };
}

// 健康檢查路由
app.get("/", (req, res) => {
  res.send("LINE Bot is running!");
});

// 啟動伺服器
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`伺服器運行在 port ${port}`);
});

// 匯出給 Vercel 使用
module.exports = app;
