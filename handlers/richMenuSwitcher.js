const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// 儲存圖文選單 ID 的快取
let richMenuIds = {
  bloodPressure: null,
  bloodSugar: null,
  VITAMIX: null
};

/**
 * 設定圖文選單 ID（在部署後呼叫）
 */
function setRichMenuIds(ids) {
  richMenuIds = { ...richMenuIds, ...ids };
}

/**
 * 取得所有圖文選單並快取 ID
 */
async function fetchRichMenuIds() {
  try {
    const menus = await client.getRichMenuList();

    menus.forEach(menu => {
      if (menu.name === '血壓計主選單') {
        richMenuIds.bloodPressure = menu.richMenuId;
      } else if (menu.name === 'bloodSugar') {
        richMenuIds.bloodSugar = menu.richMenuId;
      } else if (menu.name === 'VITAMIX') {
        richMenuIds.VITAMIX = menu.richMenuId;
      }
    });

    console.log('Rich Menu IDs cached:', richMenuIds);
  } catch (error) {
    console.error('Failed to fetch rich menu IDs:', error);
  }
}

/**
 * 切換使用者的圖文選單
 * @param {string} userId - LINE 使用者 ID
 * @param {string} menuName - 選單名稱 (bloodPressure, bloodSugar, VITAMIX)
 */
async function switchRichMenu(userId, menuName) {
  try {
    // 如果快取中沒有 ID，先取得
    if (!richMenuIds[menuName]) {
      await fetchRichMenuIds();
    }

    const richMenuId = richMenuIds[menuName];

    if (!richMenuId) {
      console.error(`Rich menu ID not found for: ${menuName}`);
      return null;
    }

    // 綁定圖文選單給使用者
    await client.linkRichMenuToUser(userId, richMenuId);
    console.log(`Switched to ${menuName} for user ${userId}`);

    // 不回傳任何訊息（因為 displayText 設定為空）
    return null;
  } catch (error) {
    console.error('Failed to switch rich menu:', error);
    return null;
  }
}

// 初始化時取得圖文選單 ID
fetchRichMenuIds();

module.exports = {
  switchRichMenu,
  setRichMenuIds,
  fetchRichMenuIds
};
