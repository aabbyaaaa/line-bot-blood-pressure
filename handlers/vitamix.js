const fs = require('fs');
const path = require('path');

// 預先載入 JSON（如果失敗會在函數中重新載入）
let flexInfo;
try { flexInfo = require("../richmenus/vitamix/flex_info.json"); } catch(_) {}

/**
 * 輔助函數：動態載入 JSON 檔案
 */
function loadJson(relPath) {
  const abs = path.join(process.cwd(), relPath);
  const raw = fs.readFileSync(abs, 'utf8');
  return JSON.parse(raw);
}

/**
 * 確保 Flex Message 格式正確
 */
function ensureFlexMessages(obj, altText) {
  if (!obj) return { type: 'text', text: '內容暫時無法顯示' };

  // 如果已經是完整的 flex message
  if (obj.type === 'flex') return obj;

  // 如果只有 contents（carousel）
  if (obj.type === 'carousel' || (obj.contents && Array.isArray(obj.contents))) {
    return {
      type: 'flex',
      altText: altText || 'VITAMIX資訊',
      contents: obj
    };
  }

  return { type: 'text', text: '格式錯誤' };
}

/**
 * 處理 VITAMIX 資訊查詢
 * data: "action=vitamix_info"
 */
function handleVitamixInfo() {
  try {
    const obj = flexInfo || loadJson(path.join('richmenus', 'vitamix', 'flex_info.json'));
    return ensureFlexMessages(obj, 'VITAMIX資訊');
  } catch (e) {
    console.error('Failed to load VITAMIX info JSON', e);
    return { type: 'text', text: '內容暫時無法顯示，請稍後再試。' };
  }
}

module.exports = {
  handleVitamixInfo
};
