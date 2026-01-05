const fs = require('fs');
const path = require('path');

// 預先載入 JSON（如果失敗會在函數中重新載入）
let flexInfo;
try { flexInfo = require("../richmenus/bloodSugar/flex_info.json"); } catch(_) {}

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
      altText: altText || '血糖機/血糖試紙 詢價最低79折起',
      contents: obj
    };
  }

  return { type: 'text', text: '格式錯誤' };
}

/**
 * 處理血糖資訊查詢
 * data: "action=blood_sugar_info"
 */
function handleBloodSugarInfo() {
  try {
    const obj = flexInfo || loadJson(path.join('richmenus', 'bloodSugar', 'flex_info.json'));
    return ensureFlexMessages(obj, '血糖資訊');
  } catch (e) {
    console.error('Failed to load blood sugar info JSON', e);
    return { type: 'text', text: '內容暫時無法顯示，請稍後再試。' };
  }
}

module.exports = {
  handleBloodSugarInfo
};
