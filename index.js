const express = require("express");
const line = require("@line/bot-sdk");
const bp = require("./handlers/bloodPressure");
const bs = require("./handlers/bloodSugar");
const vm = require("./handlers/vitamix");
const richMenuSwitcher = require("./handlers/richMenuSwitcher");
require("dotenv").config();

const app = express();

// LINE Bot 設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// 健康檢查端點
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "LINE Bot is running",
    hasToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
    hasSecret: !!process.env.LINE_CHANNEL_SECRET
  });
});

// 處理 LINE Webhook
app.post("/webhook", line.middleware(config), (req, res) => {
  console.log('Received webhook:', JSON.stringify(req.body));
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => {
      console.log('Webhook handled successfully:', JSON.stringify(result));
      res.json(result);
    })
    .catch((err) => {
      console.error('Error handling webhook:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json({ error: err.message });
    });
});

// 處理各種事件
async function handleEvent(event) {
  if (event.type !== "message" && event.type !== "postback") {
    return Promise.resolve(null);
  }

  let replyMessage;

  if (event.type === "postback") {
    const data = event.postback.data;

    // 處理圖文選單切換（不回傳訊息）
    if (data === "action=switch_to_bloodPressure") {
      await richMenuSwitcher.switchRichMenu(event.source.userId, "bloodPressure");
      return Promise.resolve(null);
    }
    if (data === "action=switch_to_bloodSugar") {
      await richMenuSwitcher.switchRichMenu(event.source.userId, "bloodSugar");
      return Promise.resolve(null);
    }
    if (data === "action=switch_to_VITAMIX") {
      await richMenuSwitcher.switchRichMenu(event.source.userId, "VITAMIX");
      return Promise.resolve(null);
    }

    // 處理其他 postback
    replyMessage = handlePostback(data);
  } else if (event.type === "message" && event.message.type === "text") {
    // 處理文字訊息
    replyMessage = handleTextMessage(event.message.text);
  }

  // 若為回聲型預設回覆（內容包含使用者原文），則不回覆
  if (
    replyMessage &&
    replyMessage.type === "text" &&
    typeof replyMessage.text === "string" &&
    event.type === "message" &&
    event.message &&
    event.message.type === "text" &&
    replyMessage.text.includes(event.message.text)
  ) {
    replyMessage = null;
  }

  if (replyMessage) {
    return client.replyMessage(event.replyToken, replyMessage);
  }
}

// 處理 Postback 事件
function handlePostback(data) {
  console.log("Postback data:", data);

  // A: fat → delegate to handler (loads JSON and chunks if >10)
  if (data === "fat") {
    return bp.handleFat();
  }
  if (data === "fat_info" || (typeof data === "string" && data.startsWith("fat_detail:"))) {
    return bp.handleFatInfo();
  }
  if (typeof data === "string" && data.startsWith("bp:")) {
    return bp.handleProductInquiry();
  }

  // Blood pressure flows routed to handlers
  if (data === "blood") {
    return bp.handleBloodIntro();
  }
  if (data === "action=bp_categories") {
    return bp.handleBpCategories();
  }
  if (data === "action=current_offers") {
    return bp.handleOffers();
  }
  if (data === "action=why_choose_us") {
    return bp.handleWhyUs();
  }

  // Blood sugar flows routed to handlers
  if (data === "action=blood_sugar_info") {
    return bs.handleBloodSugarInfo();
  }

  // VITAMIX flows routed to handlers
  if (data === "action=vitamix_info") {
    return vm.handleVitamixInfo();
  }
  if (data === "category=omron_arm") {
    return bp.handleCategory("omron_arm");
  }
  if (data === "category=omron_other") {
    return bp.handleCategory("omron_other");
  }
  if (data === "category=citizen_bp") {
    return bp.handleCategory("citizen_bp");
  }
  if (data === "category=nissei_bp") {
    return bp.handleCategory("nissei_bp");
  }

  switch (data) {
    case "action=add_on_scale":
      // 上方區塊：體脂計加購
      return getFlexMessage3();

    case "action=bp_categories":
      // 左下：血壓計分類 - 回傳 Quick Reply
      return {
        type: "text",
        text: "📌請選擇您想了解的血壓計分類：",
        quickReply: {
          items: [
            {
              type: "action",
              action: {
                type: "postback",
                label: "歐姆龍 手腕式血壓計",
                data: "category=wrist_bp",
                displayText: "歐姆龍 手腕式血壓計",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "歐姆龍 手臂式血壓計",
                data: "category=arm_bp",
                displayText: "歐姆龍 手臂式血壓計",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "歐姆龍 隧道式血壓計",
                data: "category=bluetooth_bp",
                displayText: "歐姆龍 隧道式血壓計",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "日本精密 血壓計",
                data: "category=omron_bp",
                displayText: "日本精密 血壓計",
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

    // 新增：處理 button 的 "fat" postback
    case "fat":
      return {
        type: "text",
        text: "✨ 優惠價僅限購買血壓計／血糖機時加購適用，詳情請洽客服。",
      };

    // 新增：處理 button 的 "blood" postback
    case "blood":
      return [
        {
          type: "text",
          text: "客服時間：平日 09:00–17:30。",
        },
        {
          type: "text",
          text: "請留言您想購買的商品（不確定型號也沒關係），我們會盡快回覆並提供報價，價格超優，值得耐心等候！😊 ",
        },
        {
          type: "text",
          text: "請選擇您想了解的血壓計分類",
          quickReply: {
            items: [
              {
                type: "action",
                action: {
                  type: "postback",
                  label: "歐姆龍 手腕式血壓計",
                  data: "category=wrist_bp",
                  displayText: "歐姆龍 手腕式血壓計",
                },
              },
              {
                type: "action",
                action: {
                  type: "postback",
                  label: "歐姆龍 手臂式血壓計",
                  data: "category=arm_bp",
                  displayText: "歐姆龍 手臂式血壓計",
                },
              },
              {
                type: "action",
                action: {
                  type: "postback",
                  label: "歐姆龍 隧道式血壓計",
                  data: "category=bluetooth_bp",
                  displayText: "歐姆龍 隧道式血壓計",
                },
              },
              {
                type: "action",
                action: {
                  type: "postback",
                  label: "日本精密 血壓計",
                  data: "category=omron_bp",
                  displayText: "日本精密 血壓計",
                },
              },
            ],
          },
        },
      ];

    default:
      return {
        type: "text",
        text: "請留言您想購買的商品（不確定型號也沒關係），我們會盡快回覆並提供報價，價格超優，值得耐心等候！😊",
      };
  }
}

// 處理文字訊息
function handleTextMessage(text) {
  switch (text.trim()) {
    case "體脂計加價購，最低69折起":
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

// 血壓計活動

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
                url: "https://cdn.shopify.com/s/files/1/0204/3327/2854/files/2500x1686-LINE.jpg?v=1758785698",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "1:1",
                gravity: "center",
                action: {
                  type: "postback",
                  label: "action",
                  data: "action=add_on_scale",
                  displayText: "體脂計加價購，最低69折起",
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

// 體脂計加價購，最低69折起

function getFlexMessage3() {
  return {
    type: "flex",
    altText: "體脂計加價購，最低69折起",
    contents: {
      type: "carousel",
      contents: [
        {
          type: "bubble",
          size: "micro",
          hero: {
            type: "image",
            url: "https://dglife.tw/cdn/shop/products/2021052610273338.jpg?v=1639721163",
            aspectMode: "fit",
            aspectRatio: "320:230",
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
                    text: "OMRON 歐姆龍",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                    offsetTop: "2px",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "體脂計 HBF217",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
              },
              {
                type: "text",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
                text: "   .",
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
                height: "30px",
                offsetTop: "2px",
              },
              {
                type: "button",
                style: "primary",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "了解更多",
                  data: "fat",
                },
                offsetTop: "3px",
              },
            ],
            spacing: "sm",
            paddingEnd: "10px",
            paddingStart: "10px",
          },
          styles: {
            body: {
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
            url: "https://dglife.tw/cdn/shop/files/D52O-HBF222T-DGS.jpg?v=1706512322",
            aspectMode: "fit",
            aspectRatio: "320:230",
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
                    text: "OMRON 歐姆龍",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                    offsetTop: "2px",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "十合一藍牙體組成計",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
              },
              {
                type: "text",
                text: "BC-402",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
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
                height: "30px",
                offsetTop: "2px",
              },
              {
                type: "button",
                style: "primary",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "了解更多",
                  data: "fat",
                },
                offsetTop: "3px",
              },
            ],
            spacing: "sm",
            paddingEnd: "10px",
            paddingStart: "10px",
          },
          styles: {
            body: {
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
            url: "https://dglife.tw/cdn/shop/products/HBF-702T.jpg?v=1639721169",
            aspectMode: "fit",
            aspectRatio: "320:230",
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
                    text: "OMRON 歐姆龍",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                    offsetTop: "2px",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "體重體脂肪計 HBF702T",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
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
                height: "30px",
                offsetTop: "2px",
              },
              {
                type: "button",
                style: "primary",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "了解更多",
                  data: "fat",
                },
                offsetTop: "3px",
              },
            ],
            spacing: "sm",
            paddingEnd: "10px",
            paddingStart: "10px",
          },
          styles: {
            body: {
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
            url: "https://dglife.tw/cdn/shop/products/HBF-702T.jpg?v=1639721169",
            aspectMode: "fit",
            aspectRatio: "320:230",
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
                    text: "OMRON 歐姆龍",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                    offsetTop: "2px",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "體重體脂肪計 HBF702T",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
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
                height: "30px",
                offsetTop: "2px",
              },
              {
                type: "button",
                style: "primary",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "了解更多",
                  data: "fat",
                },
                offsetTop: "3px",
              },
            ],
            spacing: "sm",
            paddingEnd: "10px",
            paddingStart: "10px",
          },
          styles: {
            body: {
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
            url: "https://dglife.tw/cdn/shop/products/HBF-702T.jpg?v=1639721169",
            aspectMode: "fit",
            aspectRatio: "320:230",
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
                    text: "OMRON 歐姆龍",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                    offsetTop: "2px",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "體重體脂肪計 HBF702T",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
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
                height: "30px",
                offsetTop: "2px",
              },
              {
                type: "button",
                style: "primary",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "了解更多",
                  data: "fat",
                },
                offsetTop: "3px",
              },
            ],
            spacing: "sm",
            paddingEnd: "10px",
            paddingStart: "10px",
          },
          styles: {
            body: {
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
            url: "https://dglife.tw/cdn/shop/products/HBF-702T.jpg?v=1639721169",
            aspectMode: "fit",
            aspectRatio: "320:230",
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
                    text: "OMRON 歐姆龍",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                    offsetTop: "2px",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "體重體脂肪計 HBF702T",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
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
                height: "30px",
                offsetTop: "2px",
              },
              {
                type: "button",
                style: "primary",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "了解更多",
                  data: "fat",
                },
                offsetTop: "3px",
              },
            ],
            spacing: "sm",
            paddingEnd: "10px",
            paddingStart: "10px",
          },
          styles: {
            body: {
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
            url: "https://dglife.tw/cdn/shop/products/HBF-702T.jpg?v=1639721169",
            aspectMode: "fit",
            aspectRatio: "320:230",
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
                    text: "OMRON 歐姆龍",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                    offsetTop: "2px",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "體重體脂肪計 HBF702T",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
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
                height: "30px",
                offsetTop: "2px",
              },
              {
                type: "button",
                style: "primary",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "了解更多",
                  data: "fat",
                },
                offsetTop: "3px",
              },
            ],
            spacing: "sm",
            paddingEnd: "10px",
            paddingStart: "10px",
          },
          styles: {
            body: {
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
            url: "https://dglife.tw/cdn/shop/products/HBF-702T.jpg?v=1639721169",
            aspectMode: "fit",
            aspectRatio: "320:230",
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
                    text: "OMRON 歐姆龍",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                    offsetTop: "2px",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "體重體脂肪計 HBF702T",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
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
                height: "30px",
                offsetTop: "2px",
              },
              {
                type: "button",
                style: "primary",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "了解更多",
                  data: "fat",
                },
                offsetTop: "3px",
              },
            ],
            spacing: "sm",
            paddingEnd: "10px",
            paddingStart: "10px",
          },
          styles: {
            body: {
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
            url: "https://dglife.tw/cdn/shop/products/HBF-702T.jpg?v=1639721169",
            aspectMode: "fit",
            aspectRatio: "320:230",
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
                    text: "OMRON 歐姆龍",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                    offsetTop: "2px",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "體重體脂肪計 HBF702T",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
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
                height: "30px",
                offsetTop: "2px",
              },
              {
                type: "button",
                style: "primary",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "了解更多",
                  data: "fat",
                },
                offsetTop: "3px",
              },
            ],
            spacing: "sm",
            paddingEnd: "10px",
            paddingStart: "10px",
          },
          styles: {
            body: {
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
            url: "https://dglife.tw/cdn/shop/products/HBF-702T.jpg?v=1639721169",
            aspectMode: "fit",
            aspectRatio: "320:230",
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
                    text: "OMRON 歐姆龍",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                    offsetTop: "2px",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "體重體脂肪計 HBF702T",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
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
                height: "30px",
                offsetTop: "2px",
              },
              {
                type: "button",
                style: "primary",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "了解更多",
                  data: "fat",
                },
                offsetTop: "3px",
              },
            ],
            spacing: "sm",
            paddingEnd: "10px",
            paddingStart: "10px",
          },
          styles: {
            body: {
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
            url: "https://dglife.tw/cdn/shop/products/HBF-702T.jpg?v=1639721169",
            aspectMode: "fit",
            aspectRatio: "320:230",
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
                    text: "OMRON 歐姆龍",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                    offsetTop: "2px",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "體重體脂肪計 HBF702T",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
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
                height: "30px",
                offsetTop: "2px",
              },
              {
                type: "button",
                style: "primary",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "了解更多",
                  data: "fat",
                },
                offsetTop: "3px",
              },
            ],
            spacing: "sm",
            paddingEnd: "10px",
            paddingStart: "10px",
          },
          styles: {
            body: {
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
            url: "https://dglife.tw/cdn/shop/products/HBF-702T.jpg?v=1639721169",
            aspectMode: "fit",
            aspectRatio: "320:230",
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
                    text: "OMRON 歐姆龍",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                    offsetTop: "2px",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "體重體脂肪計 HBF702T",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
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
                height: "30px",
                offsetTop: "2px",
              },
              {
                type: "button",
                style: "primary",
                color: "#FF7F50",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "了解更多",
                  data: "fat",
                },
                offsetTop: "3px",
              },
            ],
            spacing: "sm",
            paddingEnd: "10px",
            paddingStart: "10px",
          },
          styles: {
            body: {
              separatorColor: "#FFECE6",
              backgroundColor: "#FFECE6",
            },
          },
        },
      ],
    },
  };
}

// 為什麼血壓計要跟德記生活買？

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

// 血壓計推薦

function getFlexMessage5() {
  return {
    type: "flex",
    altText: "商品資訊",
    contents: {
      type: "carousel",
      contents: [
        {
          type: "bubble",
          size: "deca",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "image",
                url: "https://dglife.tw/cdn/shop/products/118de98a750242ac110004.jpg?v=1718671087",
                size: "full",
                aspectRatio: "320:220",
                aspectMode: "fit",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "保固3年",
                    size: "xs",
                    color: "#ffffff",
                    align: "center",
                    gravity: "center",
                  },
                ],
                position: "absolute",
                flex: 0,
                width: "60px",
                height: "25px",
                backgroundColor: "#EC3D44",
                cornerRadius: "100px",
                offsetTop: "18px",
                offsetStart: "10px",
                paddingAll: "2px",
                paddingStart: "4px",
                paddingEnd: "4px",
              },
            ],
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
                    text: "歐姆龍OMRON",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "手腕式血壓計 HEM6161",
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
                    text: "優惠價 ❓❓",
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
                    offsetStart: "20px",
                  },
                ],
                offsetBottom: "5px",
                height: "28px",
              },
              {
                type: "button",
                style: "primary",
                color: "#005eb8",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "詢價最低⬊79折起",
                  data: "blood",
                },
                offsetTop: "5px",
              },
            ],
            spacing: "sm",
            paddingEnd: "15px",
            paddingStart: "15px",
          },
          styles: {
            body: {
              separatorColor: "#E6F3FF",
              backgroundColor: "#E6F3FF",
            },
          },
        },
        {
          type: "bubble",
          size: "deca",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "image",
                url: "https://dglife.tw/cdn/shop/products/118de98a750242ac110004.jpg?v=1718671087",
                size: "full",
                aspectRatio: "320:220",
                aspectMode: "fit",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "保固3年",
                    size: "xs",
                    color: "#ffffff",
                    align: "center",
                    gravity: "center",
                  },
                ],
                position: "absolute",
                flex: 0,
                width: "60px",
                height: "25px",
                backgroundColor: "#EC3D44",
                cornerRadius: "100px",
                offsetTop: "18px",
                offsetStart: "10px",
                paddingAll: "2px",
                paddingStart: "4px",
                paddingEnd: "4px",
              },
            ],
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
                    text: "歐姆龍OMRON",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "手腕式血壓計 HEM6161",
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
                    text: "優惠價 ❓❓",
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
                    offsetStart: "20px",
                  },
                ],
                offsetBottom: "5px",
                height: "28px",
              },
              {
                type: "button",
                style: "primary",
                color: "#005eb8",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "詢價最低⬊79折起",
                  data: "blood",
                },
                offsetTop: "5px",
              },
            ],
            spacing: "sm",
            paddingEnd: "15px",
            paddingStart: "15px",
          },
          styles: {
            body: {
              separatorColor: "#E6F3FF",
              backgroundColor: "#E6F3FF",
            },
          },
        },
        {
          type: "bubble",
          size: "deca",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "image",
                url: "https://dglife.tw/cdn/shop/products/118de98a750242ac110004.jpg?v=1718671087",
                size: "full",
                aspectRatio: "320:220",
                aspectMode: "fit",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "保固3年",
                    size: "xs",
                    color: "#ffffff",
                    align: "center",
                    gravity: "center",
                  },
                ],
                position: "absolute",
                flex: 0,
                width: "60px",
                height: "25px",
                backgroundColor: "#EC3D44",
                cornerRadius: "100px",
                offsetTop: "18px",
                offsetStart: "10px",
                paddingAll: "2px",
                paddingStart: "4px",
                paddingEnd: "4px",
              },
            ],
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
                    text: "歐姆龍OMRON",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "手腕式血壓計 HEM6161",
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
                    text: "優惠價 ❓❓",
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
                    offsetStart: "20px",
                  },
                ],
                offsetBottom: "5px",
                height: "28px",
              },
              {
                type: "button",
                style: "primary",
                color: "#005eb8",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "詢價最低⬊79折起",
                  data: "blood",
                },
                offsetTop: "5px",
              },
            ],
            spacing: "sm",
            paddingEnd: "15px",
            paddingStart: "15px",
          },
          styles: {
            body: {
              separatorColor: "#E6F3FF",
              backgroundColor: "#E6F3FF",
            },
          },
        },
        {
          type: "bubble",
          size: "deca",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "image",
                url: "https://dglife.tw/cdn/shop/products/118de98a750242ac110004.jpg?v=1718671087",
                size: "full",
                aspectRatio: "320:220",
                aspectMode: "fit",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "保固3年",
                    size: "xs",
                    color: "#ffffff",
                    align: "center",
                    gravity: "center",
                  },
                ],
                position: "absolute",
                flex: 0,
                width: "60px",
                height: "25px",
                backgroundColor: "#EC3D44",
                cornerRadius: "100px",
                offsetTop: "18px",
                offsetStart: "10px",
                paddingAll: "2px",
                paddingStart: "4px",
                paddingEnd: "4px",
              },
            ],
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
                    text: "歐姆龍OMRON",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "手腕式血壓計 HEM6161",
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
                    text: "優惠價 ❓❓",
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
                    offsetStart: "20px",
                  },
                ],
                offsetBottom: "5px",
                height: "28px",
              },
              {
                type: "button",
                style: "primary",
                color: "#005eb8",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "詢價最低⬊79折起",
                  data: "blood",
                },
                offsetTop: "5px",
              },
            ],
            spacing: "sm",
            paddingEnd: "15px",
            paddingStart: "15px",
          },
          styles: {
            body: {
              separatorColor: "#E6F3FF",
              backgroundColor: "#E6F3FF",
            },
          },
        },
        {
          type: "bubble",
          size: "deca",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "image",
                url: "https://dglife.tw/cdn/shop/products/118de98a750242ac110004.jpg?v=1718671087",
                size: "full",
                aspectRatio: "320:220",
                aspectMode: "fit",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "保固3年",
                    size: "xs",
                    color: "#ffffff",
                    align: "center",
                    gravity: "center",
                  },
                ],
                position: "absolute",
                flex: 0,
                width: "60px",
                height: "25px",
                backgroundColor: "#EC3D44",
                cornerRadius: "100px",
                offsetTop: "18px",
                offsetStart: "10px",
                paddingAll: "2px",
                paddingStart: "4px",
                paddingEnd: "4px",
              },
            ],
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
                    text: "歐姆龍OMRON",
                    size: "md",
                    flex: 0,
                    weight: "bold",
                  },
                ],
                offsetBottom: "5px",
              },
              {
                type: "text",
                text: "手腕式血壓計 HEM6161",
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
                    text: "優惠價 ❓❓",
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
                    offsetStart: "20px",
                  },
                ],
                offsetBottom: "5px",
                height: "28px",
              },
              {
                type: "button",
                style: "primary",
                color: "#005eb8",
                height: "sm",
                position: "relative",
                action: {
                  type: "postback",
                  label: "詢價最低⬊79折起",
                  data: "blood",
                },
                offsetTop: "5px",
              },
            ],
            spacing: "sm",
            paddingEnd: "15px",
            paddingStart: "15px",
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

