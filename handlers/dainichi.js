/**
 * Dainichi 煤油暖爐 Handler
 * 處理煤油暖爐相關的 Flex Message
 */

// 處理煤油暖爐商品列表（右邊點擊區域）
function handleDainichiProducts() {
  return {
    type: "flex",
    altText: "大日煤油暖爐商品推薦",
    contents: {
      type: "carousel",
      contents: [
        // 商品卡片 1
        {
          type: "bubble",
          size: "micro",
          hero: {
            type: "image",
            url: "https://via.placeholder.com/320x230?text=Product+1",
            aspectMode: "cover",
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
                    text: "DAINICHI 大日",
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
                text: "煤油暖爐 FW-XXXX",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
              },
              {
                type: "text",
                text: "9坪適用 | 油箱9L",
                size: "xs",
                wrap: true,
                color: "#888888",
                offsetBottom: "5px",
                offsetTop: "2px",
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "$XX,XXX",
                    color: "#EA4343",
                    weight: "bold",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                  {
                    type: "text",
                    text: "$XX,XXX",
                    decoration: "line-through",
                    size: "sm",
                    color: "#9E9E9E",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                    offsetStart: "10px",
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
                  type: "uri",
                  label: "立即選購",
                  uri: "https://dgs.com.tw/hotcategory/Dainichi/",
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
        // 商品卡片 2
        {
          type: "bubble",
          size: "micro",
          hero: {
            type: "image",
            url: "https://via.placeholder.com/320x230?text=Product+2",
            aspectMode: "cover",
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
                    text: "DAINICHI 大日",
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
                text: "煤油暖爐 FW-YYYY",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
              },
              {
                type: "text",
                text: "12坪適用 | 油箱12L",
                size: "xs",
                wrap: true,
                color: "#888888",
                offsetBottom: "5px",
                offsetTop: "2px",
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "$XX,XXX",
                    color: "#EA4343",
                    weight: "bold",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                  {
                    type: "text",
                    text: "$XX,XXX",
                    decoration: "line-through",
                    size: "sm",
                    color: "#9E9E9E",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                    offsetStart: "10px",
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
                  type: "uri",
                  label: "立即選購",
                  uri: "https://dgs.com.tw/hotcategory/Dainichi/",
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
        // 商品卡片 3
        {
          type: "bubble",
          size: "micro",
          hero: {
            type: "image",
            url: "https://via.placeholder.com/320x230?text=Product+3",
            aspectMode: "cover",
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
                    text: "DAINICHI 大日",
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
                text: "煤油暖爐 FW-ZZZZ",
                size: "sm",
                wrap: true,
                offsetBottom: "5px",
                offsetTop: "2px",
              },
              {
                type: "text",
                text: "15坪適用 | 油箱15L",
                size: "xs",
                wrap: true,
                color: "#888888",
                offsetBottom: "5px",
                offsetTop: "2px",
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "$XX,XXX",
                    color: "#EA4343",
                    weight: "bold",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                  },
                  {
                    type: "text",
                    text: "$XX,XXX",
                    decoration: "line-through",
                    size: "sm",
                    color: "#9E9E9E",
                    offsetTop: "5px",
                    offsetBottom: "5px",
                    offsetStart: "10px",
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
                  type: "uri",
                  label: "立即選購",
                  uri: "https://dgs.com.tw/hotcategory/Dainichi/",
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

module.exports = {
  handleDainichiProducts,
};
