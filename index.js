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
      // 上方區塊：熱敷墊加購
      return getFlexMessage3();

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
                label: "藍牙血壓計ZZZZZ",
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
      return getFlexMessage2();

    case "action=why_choose_us":
      // 右下：為什麼血壓計要跟德記生活買？
      return getFlexMessage4();

    // 處理 Quick Reply 的選擇
    case "category=wrist_bp":
    case "category=arm_bp":
    case "category=bluetooth_bp":
    case "category=omron_bp":
      return getFlexMessage5();

    default:
      return { type: "text", text: "感謝您的查詢！" };
  }
}

// 處理文字訊息
function handleTextMessage(text) {
  switch (text.trim()) {
    case "熱敷墊加價購，最低69折起":
      return handlePostback("action=add_on_scale");
    case "血壓計分類":
      return handlePostback("action=bp_categories");
    case "血壓計活動":
      return handlePostback("action=current_offers");
    case "為什麼血壓計要跟德記生活買？":
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

function getFlexMessage2() {
  return {
    type: "flex",
    altText: "血壓計活動", // 加上 altText
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
                url: "https://cdn.shopify.com/s/files/1/0204/3327/2854/files/8_edcd2cad-c171-45ef-9482-44ad5f2b70c2.jpg?v=1758603330",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "1:1",
                gravity: "center",
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
                url: "https://cdn.shopify.com/s/files/1/0204/3327/2854/files/5_2edb8052-f42f-4306-b8e5-e2eaee5028d6.jpg?v=1758603329",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "1:1",
                gravity: "center",
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
                url: "https://cdn.shopify.com/s/files/1/0204/3327/2854/files/20241208.jpg?v=1758603697",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "1:1",
                gravity: "center",
                action: {
                  type: "postback",
                  label: "action",
                  data: "action=add_on_scale",
                  displayText: "熱敷墊加價購，最低69折起",
                },
              },
            ],
            paddingAll: "0px",
          },
        },
      ],
    },
  };
}

function getFlexMessage3() {
  return {
    type: "flex",
    altText: "熱敷墊加價購，最低69折起",
    contents: {
      type: "carousel",
      contents: [
        {
          type: "bubble",
          size: "micro",
          hero: {
            type: "image",
            url: "https://dglife.tw/cdn/shop/products/D52B-TP60.jpg?v=1733890511",
            aspectMode: "fit",
            aspectRatio: "320:250",
            size: "full",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "beurer 博依",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                  },
                ],
              },
              {
                type: "text",
                text: "銀離子抗菌床墊型電毯 單人定時型 TP60",
                size: "sm",
                wrap: true,
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "$2,900",
                    color: "#EA4343",
                    weight: "bold",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                  {
                    type: "text",
                    text: "$3,900",
                    decoration: "line-through",
                    size: "14px",
                    color: "#9E9E9E",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                ],
              },
              {
                type: "button",
                action: {
                  type: "message",
                  label: "了解更多",
                  text: "✨ 優惠價僅限購買血壓計／血糖機時加購適用，詳情請洽客服。",
                },
                style: "primary",
                offsetBottom: "18px",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
                offsetTop: "8px",
              },
            ],
            spacing: "sm",
            paddingAll: "13px",
          },
          styles: {
            body: {
              separator: true,
              separatorColor: "#FFECE6",
              backgroundColor: "#FFECE6",
            },
          },
        },
        {
          type: "bubble",
          size: "micro",
          hero: {
            type: "image",
            url: "https://dglife.tw/cdn/shop/products/SP1213.jpg?v=1639721372",
            aspectMode: "fit",
            aspectRatio: "320:250",
            size: "full",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "SUNLUS 三樂事",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                  },
                ],
              },
              {
                type: "text",
                text: "暖暖頸肩雙用熱敷柔毛墊 SP1213",
                size: "sm",
                wrap: true,
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "$2,799",
                    color: "#EA4343",
                    weight: "bold",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                  {
                    type: "text",
                    text: "$3,900",
                    decoration: "line-through",
                    size: "14px",
                    color: "#9E9E9E",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                ],
              },
              {
                type: "button",
                action: {
                  type: "message",
                  label: "了解更多",
                  text: "✨ 優惠價僅限購買血壓計／血糖機時加購適用，詳情請洽客服。",
                },
                style: "primary",
                offsetTop: "8px",
                offsetBottom: "18px",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
              },
            ],
            spacing: "sm",
            paddingAll: "13px",
          },
          styles: {
            body: {
              separator: true,
              separatorColor: "#FFECE6",
              backgroundColor: "#FFECE6",
            },
          },
        },
        {
          type: "bubble",
          size: "micro",
          hero: {
            type: "image",
            url: "https://dglife.tw/cdn/shop/products/D52B-TP80.jpg?v=1672386012",
            aspectMode: "fit",
            aspectRatio: "320:250",
            size: "full",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "beurer 博依",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                  },
                ],
              },
              {
                type: "text",
                text: "銀離子抗菌床墊型電毯 單人定時型 TP60",
                size: "sm",
                wrap: true,
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "$2,900",
                    color: "#EA4343",
                    weight: "bold",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                  {
                    type: "text",
                    text: "$3,900",
                    decoration: "line-through",
                    size: "14px",
                    color: "#9E9E9E",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                ],
              },
              {
                type: "button",
                action: {
                  type: "message",
                  label: "了解更多",
                  text: "✨ 優惠價僅限購買血壓計／血糖機時加購適用，詳情請洽客服。",
                },
                style: "primary",
                offsetTop: "8px",
                offsetBottom: "18px",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
              },
            ],
            spacing: "sm",
            paddingAll: "13px",
          },
          styles: {
            body: {
              separator: true,
              separatorColor: "#FFECE6",
              backgroundColor: "#FFECE6",
            },
          },
        },
        {
          type: "bubble",
          size: "micro",
          hero: {
            type: "image",
            url: "https://dglife.tw/cdn/shop/files/D52B-HK49.jpg?v=1733890490",
            aspectMode: "fit",
            aspectRatio: "320:250",
            size: "full",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "beurer 博依",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                  },
                ],
              },
              {
                type: "text",
                text: "銀離子抗菌床墊型電毯 單人定時型 TP60",
                size: "sm",
                wrap: true,
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "$2,900",
                    color: "#EA4343",
                    weight: "bold",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                  {
                    type: "text",
                    text: "$3,900",
                    decoration: "line-through",
                    size: "14px",
                    color: "#9E9E9E",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                ],
              },
              {
                type: "button",
                action: {
                  type: "message",
                  label: "了解更多",
                  text: "✨ 優惠價僅限購買血壓計／血糖機時加購適用，詳情請洽客服。",
                },
                style: "primary",
                offsetTop: "8px",
                offsetBottom: "18px",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
              },
            ],
            spacing: "sm",
            paddingAll: "13px",
          },
          styles: {
            body: {
              separator: true,
              separatorColor: "#FFECE6",
              backgroundColor: "#FFECE6",
            },
          },
        },
        {
          type: "bubble",
          size: "micro",
          hero: {
            type: "image",
            url: "https://dglife.tw/cdn/shop/products/HK55-800_1500x_3dbfb6f7-b36c-4fbe-ab70-b054cc3594ee.jpg?v=1640682441",
            aspectMode: "fit",
            aspectRatio: "320:250",
            size: "full",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "beurer 博依",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                  },
                ],
              },
              {
                type: "text",
                text: "銀離子抗菌床墊型電毯 單人定時型 TP60",
                size: "sm",
                wrap: true,
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "$2,900",
                    color: "#EA4343",
                    weight: "bold",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                  {
                    type: "text",
                    text: "$3,900",
                    decoration: "line-through",
                    size: "14px",
                    color: "#9E9E9E",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                ],
              },
              {
                type: "button",
                action: {
                  type: "message",
                  label: "了解更多",
                  text: "✨ 優惠價僅限購買血壓計／血糖機時加購適用，詳情請洽客服。",
                },
                style: "primary",
                offsetTop: "8px",
                offsetBottom: "18px",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
              },
            ],
            spacing: "sm",
            paddingAll: "13px",
          },
          styles: {
            body: {
              separator: true,
              separatorColor: "#FFECE6",
              backgroundColor: "#FFECE6",
            },
          },
        },
      ],
    },
  };
}

function getFlexMessage4() {
  return {
    type: "flex",
    altText: "為什麼血壓計要跟德記生活買？",
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
                url: "https://cdn.shopify.com/s/files/1/0204/3327/2854/files/6_30b113a8-ace7-4480-835d-a228fca05b45.jpg?v=1758603329",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "1:1",
                gravity: "center",
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
                url: "https://cdn.shopify.com/s/files/1/0204/3327/2854/files/4_5576ad96-b037-4a23-b39b-4eb7ef692aae.jpg?v=1758603329",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "1:1",
                gravity: "center",
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
                url: "https://cdn.shopify.com/s/files/1/0204/3327/2854/files/BN-1000x1000-2.jpg?v=1758619217",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "1:1",
                gravity: "center",
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
                url: "https://cdn.shopify.com/s/files/1/0204/3327/2854/files/7_312ff866-18f2-412c-9da4-79e3b0c3fb07.jpg?v=1758603329",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "1:1",
                gravity: "center",
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
                url: "https://cdn.shopify.com/s/files/1/0204/3327/2854/files/1_509f716f-2d02-4424-aad6-5ee6c11df788.jpg?v=1758603330",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "1:1",
                gravity: "center",
              },
            ],
            paddingAll: "0px",
          },
        },
      ],
    },
  };
}

function getFlexMessage5() {
  return {
    type: "flex",
    altText: "商品資訊",
    contents: {
      type: "carousel",
      contents: [
        {
          type: "bubble",
          size: "micro",
          hero: {
            type: "image",
            url: "https://dglife.tw/cdn/shop/products/D52B-TP60.jpg?v=1733890511",
            aspectMode: "fit",
            aspectRatio: "320:220",
            size: "full",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "beurer 博依",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "銀離子抗菌床墊型電毯 單人定時型 TP60",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "$2,900",
                    color: "#EA4343",
                    weight: "bold",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                  {
                    type: "text",
                    text: "$3,900",
                    decoration: "line-through",
                    size: "14px",
                    color: "#9E9E9E",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "button",
                style: "primary",
                color: "#005eb8",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "action",
                  data: "hello",
                },
                offsetTop: "5px",
              },
            ],
            spacing: "sm",
            paddingEnd: "10px",
            paddingStart: "10px",
          },
          styles: {
            body: {
              separatorColor: "#E6F3FF",
              backgroundColor: "#E6F3FF",
            },
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
