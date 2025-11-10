   1: const fs = require("fs");
   2: const path = require("path");
   3: 
   4: // Statically include JSON so serverless bundlers ship files
   5: let flexFat;
   6: let flexBlood;
   7: let flexBloodIndex;
   8: let flexOffers;
   9: let flexWhyUs;
  10: try { flexFat = require("../bloodPressure/flex_fat.json"); } catch(_) {}
  11: try { flexBlood = require("../bloodPressure/flex_blood.json"); } catch(_) {}
  12: try { flexBloodIndex = require("../bloodPressure/flex_blood_index.json"); } catch(_) {}
  13: try { flexOffers = require("../bloodPressure/flex_discount202509.json"); } catch(_) {}
  14: try { flexWhyUs = require("../bloodPressure/flex_whyus.json"); } catch(_) {}
  15: 
  16: function chunkFlexIfNeeded(msg) {
  17:   try {
  18:     if (
  19:       msg &&
  20:       msg.contents &&
  21:       msg.contents.type === "carousel" &&
  22:       Array.isArray(msg.contents.contents) &&
  23:       msg.contents.contents.length > 10
  24:     ) {
  25:       const items = msg.contents.contents;
  26:       const out = [];
  27:       for (let i = 0; i < items.length; i += 10) {
  28:         out.push({
  29:           type: "flex",
  30:           altText: msg.altText || "內容",
  31:           contents: { type: "carousel", contents: items.slice(i, i + 10) },
  32:         });
  33:       }
  34:       return out;
  35:     }
  36:   } catch (_) {}
  37:   return msg;
  38: }
  39: 
  40: function handleFat() {
  41:   if (flexFat) return chunkFlexIfNeeded(flexFat);
  42:   try {
  43:     const raw = fs.readFileSync(path.join(__dirname, "..", "bloodPressure", "flex_fat.json"), "utf8");
  44:     return chunkFlexIfNeeded(JSON.parse(raw));
  45:   } catch (e) {
  46:     console.error("Failed to load flex_fat.json", e);
  47:     return { type: "text", text: "內容暫時無法顯示，請稍後再試。" };
  48:   }
  49: }
  50: 
  51: module.exports = {
  52:   handleFat,
  53:   handleBloodIntro,
  54:   handleBpCategories,
  55:   handleCategory,
  56:   handleOffers,
  57:   handleWhyUs,
  58: };
  59: 
  60: function quickReplyItems() {
  61:   return [
  62:     { type: 'action', action: { type: 'postback', label: '歐姆龍 手臂式', data: 'category=omron_arm', displayText: '歐姆龍 手臂式' } },
  63:     { type: 'action', action: { type: 'postback', label: '歐姆龍 血壓計（手腕、隧道）', data: 'category=omron_other', displayText: '歐姆龍 血壓計（手腕、隧道）' } },
  64:     { type: 'action', action: { type: 'postback', label: 'CITIZEN 星辰 血壓計', data: 'category=citizen_bp', displayText: 'CITIZEN 星辰 血壓計' } },
  65:     { type: 'action', action: { type: 'postback', label: 'NISSEI 日本精密 血壓計', data: 'category=nissei_bp', displayText: 'NISSEI 日本精密 血壓計' } },
  66:   ];
  67: }
  68: 
  69: function handleBloodIntro() {
  70:   return [
  71:     { type: 'text', text: '客服時間：平日 09:00–17:30。' },
  72:     { type: 'text', text: '請留言您想購買的商品（不確定型號也沒關係），我們會盡快回覆並提供報價，價格超優，值得耐心等候！😊 ' },
  73:     { type: 'text', text: '請選擇您想了解的血壓計分類', quickReply: { items: quickReplyItems() } },
  74:   ];
  75: }
  76: 
  77: function handleBpCategories() {
  78:   return { type: 'text', text: '📌請選擇您想了解的血壓計分類：', quickReply: { items: quickReplyItems() } };
  79: }
  80: 
  81: function loadJson(relPath) {
  82:   const filePath = path.join(__dirname, '..', relPath);
  83:   const raw = fs.readFileSync(filePath, 'utf8');
  84:   return JSON.parse(raw);
  85: }
  86: 
  87: function handleOffers() {
  88:   if (flexOffers) return flexOffers;
  89:   try { return loadJson(path.join('bloodPressure','flex_discount202509.json')); }
  90:   catch (e) { console.error('Failed to load discount JSON', e); return { type: 'text', text: '內容暫時無法顯示，請稍後再試。' }; }
  91: }
  92: 
  93: function handleWhyUs() {
  94:   if (flexWhyUs) return flexWhyUs;
  95:   try { return loadJson(path.join('bloodPressure','flex_whyus.json')); }
  96:   catch (e) { console.error('Failed to load whyus JSON', e); return { type: 'text', text: '內容暫時無法顯示，請稍後再試。' }; }
  97: }
  98: 
  99: function handleCategoryKey(key) {
 100:   try {
 101:     const msg = flexBlood || loadJson(path.join('bloodPressure','flex_blood.json'));
 102:     const items = Array.isArray(msg?.contents?.contents) ? msg.contents.contents : [];
 103:     let idxs = (flexBloodIndex && flexBloodIndex.categories && flexBloodIndex.categories[key]) || [];
 104:     let finalItems = idxs.length ? idxs.map(i => items[i]).filter(Boolean) : items;
 105:     if (!finalItems.length) return { type:'text', text:'目前此分類暫無資料' };
 106:     const chunks = [];
 107:     for (let i=0;i<finalItems.length;i+=10) {
 108:       chunks.push({ type:'flex', altText: msg.altText || '血壓計商品', contents:{ type:'carousel', contents: finalItems.slice(i,i+10) }});
 109:     }
 110:     chunks.push({ type:'text', text:'📌請選擇您想了解的血壓計分類：', quickReply:{ items: quickReplyItems() } });
 111:     return chunks;
 112:   } catch (e) {
 113:     console.error('Failed to load flex_blood.json', e); return { type:'text', text:'內容暫時無法顯示，請稍後再試。' };
 114:   }
 115: }
 116: 
 117: // lightweight CSV parser for handler internal use
 118: function parseCSV(text) {
 119:   const rows = [];
 120:   let i=0, field='', row=[], inq=false;
 121:   while(i<text.length){ const ch=text[i];
 122:     if(inq){ if(ch==='"'){ if(text[i+1]==='"'){ field+='"'; i+=2; continue;} inq=false; i++; continue;} field+=ch; i++; continue; }
 123:     if(ch==='"'){ inq=true; i++; continue; }
 124:     if(ch===','){ row.push(field); field=''; i++; continue; }
 125:     if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&text[i+1]==='\n') i++; row.push(field); field=''; rows.push(row); row=[]; i++; continue; }
 126:     field+=ch; i++; }
 127:   if(field.length>0||row.length>0){ row.push(field); rows.push(row); }
 128:   return rows.filter(r=>r.length&&r.some(c=>(c||'').trim().length>0));
 129: }
 130: 
 131: function handleCategory(key) { return handleCategoryKey(key); }
