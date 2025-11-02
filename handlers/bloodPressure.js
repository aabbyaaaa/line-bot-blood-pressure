const fs = require("fs");
const path = require("path");

// Statically include JSON so serverless bundlers ship files
let flexFat;
let flexBlood;
let flexBloodIndex;
let flexOffers;
let flexWhyUs;
try { flexFat = require("../bloodPressure/flex_fat.json"); } catch(_) {}
try { flexBlood = require("../bloodPressure/flex_blood.json"); } catch(_) {}
try { flexBloodIndex = require("../bloodPressure/flex_blood_index.json"); } catch(_) {}
try { flexOffers = require("../bloodPressure/flex_discount202509.json"); } catch(_) {}
try { flexWhyUs = require("../bloodPressure/flex_whyus.json"); } catch(_) {}

function chunkFlexIfNeeded(msg) {
  try {
    if (
      msg &&
      msg.contents &&
      msg.contents.type === "carousel" &&
      Array.isArray(msg.contents.contents) &&
      msg.contents.contents.length > 10
    ) {
      const items = msg.contents.contents;
      const out = [];
      for (let i = 0; i < items.length; i += 10) {
        out.push({
          type: "flex",
          altText: msg.altText || "內容",
          contents: { type: "carousel", contents: items.slice(i, i + 10) },
        });
      }
      return out;
    }
  } catch (_) {}
  return msg;
}

function handleFat() {
  const guide = { type: 'text', text: '😍 熱敷墊加價購 最低69折起' };
  try {
    const base = flexFat || JSON.parse(fs.readFileSync(path.join(__dirname, "..", "bloodPressure", "flex_fat.json"), "utf8"));
    const chunked = chunkFlexIfNeeded(base);
    if (Array.isArray(chunked)) return [...chunked, guide];
    return [chunked, guide];
  } catch (e) {
    console.error("Failed to load flex_fat.json", e);
    return { type: "text", text: "內容暫時無法顯示，請稍後再試。" };
  }
}

module.exports = {
  handleFat,
  handleBloodIntro,
  handleBpCategories,
  handleCategory,
  handleOffers,
  handleWhyUs,
  handleFatInfo,
  handleProductInquiry,
};

function quickReplyItems() {
  return [
    { type: 'action', action: { type: 'postback', label: '歐姆龍OMRON 手臂式', data: 'category=omron_arm', displayText: '歐姆龍OMRON 手臂式' } },
    { type: 'action', action: { type: 'postback', label: '歐姆龍OMRON 手腕、隧道', data: 'category=omron_other', displayText: '歐姆龍OMRON 手腕、隧道' } },
    { type: 'action', action: { type: 'postback', label: '日本精密NISSEI 血壓計', data: 'category=nissei_bp', displayText: '日本精密NISSEI 血壓計' } },
    { type: 'action', action: { type: 'postback', label: '星辰CITIZEN 血壓計', data: 'category=citizen_bp', displayText: '星辰CITIZEN 血壓計' } },
  ];
}

function handleBloodIntro() {
  return [
    { type: 'text', text: '客服時間：平日 09:00–17:30。' },
    { type: 'text', text: '請留言您想購買的商品（不確定型號也沒關係），我們會盡快回覆並提供報價，價格超優，值得耐心等候！😊 ' },
    { type: 'text', text: '請選擇您想了解的血壓計分類', quickReply: { items: quickReplyItems() } },
  ];
}

function handleBpCategories() {
  return { type: 'text', text: '📌請選擇您想了解的血壓計分類：', quickReply: { items: quickReplyItems() } };
}

function loadJson(relPath) {
  const filePath = path.join(__dirname, '..', relPath);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function ensureFlexMessages(obj, alt) {
  let msg = obj;
  if (!msg || msg.type !== 'flex') {
    msg = { type: 'flex', altText: alt || '內容', contents: obj };
  }
  return chunkFlexIfNeeded(msg);
}

function handleOffers() {
  try {
    const obj = flexOffers || loadJson(path.join('bloodPressure','flex_discount202509.json'));
    return ensureFlexMessages(obj, '血壓計優惠');
  } catch (e) {
    console.error('Failed to load discount JSON', e); return { type: 'text', text: '內容暫時無法顯示，請稍後再試。' };
  }
}

function handleWhyUs() {
  try {
    const obj = flexWhyUs || loadJson(path.join('bloodPressure','flex_whyus.json'));
    return ensureFlexMessages(obj, '德記承諾');
  } catch (e) {
    console.error('Failed to load whyus JSON', e); return { type: 'text', text: '內容暫時無法顯示，請稍後再試。' };
  }
}

function handleCategoryKey(key) {
  try {
    const msg = flexBlood || loadJson(path.join('bloodPressure','flex_blood.json'));
    const items = Array.isArray(msg?.contents?.contents) ? msg.contents.contents : [];
    let idxs = (flexBloodIndex && flexBloodIndex.categories && flexBloodIndex.categories[key]) || [];
    let finalItems = idxs.length ? idxs.map(i => items[i]).filter(Boolean) : items;
    if (!finalItems.length) return { type:'text', text:'目前此分類暫無資料' };
    const chunks = [];
    for (let i=0;i<finalItems.length;i+=10) {
      chunks.push({ type:'flex', altText: msg.altText || '血壓計商品', contents:{ type:'carousel', contents: finalItems.slice(i,i+10) }});
    }
    chunks.push({ type:'text', text:'📌請選擇您想了解的血壓計分類：', quickReply:{ items: quickReplyItems() } });
    return chunks;
  } catch (e) {
    console.error('Failed to load flex_blood.json', e); return { type:'text', text:'內容暫時無法顯示，請稍後再試。' };
  }
}

// lightweight CSV parser for handler internal use
function parseCSV(text) {
  const rows = [];
  let i=0, field='', row=[], inq=false;
  while(i<text.length){ const ch=text[i];
    if(inq){ if(ch==='"'){ if(text[i+1]==='"'){ field+='"'; i+=2; continue;} inq=false; i++; continue;} field+=ch; i++; continue; }
    if(ch==='"'){ inq=true; i++; continue; }
    if(ch===','){ row.push(field); field=''; i++; continue; }
    if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&text[i+1]==='\n') i++; row.push(field); field=''; rows.push(row); row=[]; i++; continue; }
    field+=ch; i++; }
  if(field.length>0||row.length>0){ row.push(field); rows.push(row); }
  return rows.filter(r=>r.length&&r.some(c=>(c||'').trim().length>0));
}

function handleCategory(key) { return handleCategoryKey(key); }

// postback from A cards: show one official guidance text, no QR
function handleFatInfo() {
  return { type: 'text', text: '✨ 優惠價僅限購買血壓計／血糖機時加購適用，詳情請洽客服。' };
}

// postback from B cards: show two texts then QR (four categories)
function handleProductInquiry() {
  return [
    { type: 'text', text: '客服時間：平日 09:00–17:30。' },
    { type: 'text', text: '請留言您想購買的商品（不確定型號也沒關係），我們會盡快回覆並提供報價，價格超優，值得耐心等候！😊' },
    { type: 'text', text: '📌請選擇您想了解的血壓計分類：', quickReply: { items: quickReplyItems() } },
  ];
}
