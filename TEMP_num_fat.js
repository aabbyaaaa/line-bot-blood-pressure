   1: // Build bloodPressure/flex_fat.json from richmenus/bloodPressure/flex_fat.csv
   2: // CSV header expected:
   3: // image_url,brand,model,subtitle,price,price_original,button_type,button_label,button_data_or_url,order,altText
   4: 
   5: const fs = require('fs');
   6: const path = require('path');
   7: 
   8: const CANDIDATE_CSV_PATHS = [
   9:   path.join('bloodPressure', 'flex_fat.csv'),
  10:   path.join('richmenus', 'bloodPressure', 'flex_fat.csv'),
  11: ];
  12: const OUT_PATH = path.join('bloodPressure', 'flex_fat.json');
  13: 
  14: function parseCSV(text) {
  15:   const rows = [];
  16:   let i = 0, field = '', row = [], inQuotes = false;
  17:   while (i < text.length) {
  18:     const ch = text[i];
  19:     if (inQuotes) {
  20:       if (ch === '"') {
  21:         if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
  22:         inQuotes = false; i++; continue;
  23:       } else { field += ch; i++; continue; }
  24:     }
  25:     if (ch === '"') { inQuotes = true; i++; continue; }
  26:     if (ch === ',') { row.push(field); field = ''; i++; continue; }
  27:     if (ch === '\n' || ch === '\r') {
  28:       // handle CRLF/ LF
  29:       if (ch === '\r' && text[i + 1] === '\n') i++;
  30:       row.push(field); field = ''; rows.push(row); row = []; i++; continue;
  31:     }
  32:     field += ch; i++;
  33:   }
  34:   // last field
  35:   if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  36:   return rows;
  37: }
  38: 
  39: const ALT_TEXT = '熱敷墊加價購 最低69折起';
  40: 
  41: function ensureDollar(s) {
  42:   if (!s) return s;
  43:   const t = String(s).trim();
  44:   if (t.startsWith('$')) return t;
  45:   return `$${t}`;
  46: }
  47: 
  48: function toBubble(rec) {
  49:   const image_url = rec.image_url?.trim();
  50:   const brand = rec.brand?.trim();
  51:   const model = rec.model?.trim();
  52:   const subtitle = (rec.subtitle ?? '').trim();
  53:   const price = ensureDollar(rec.price?.trim());
  54:   const price_original = ensureDollar((rec.price_original ?? '').trim());
  55:   const button_type = (rec.button_type ?? 'postback').trim();
  56:   const button_label = (rec.button_label ?? '了解更多').trim();
  57:   const btnDataOrUrl = (rec.button_data_or_url ?? '').trim();
  58: 
  59:   const action = button_type === 'uri'
  60:     ? { type: 'uri', label: button_label, uri: btnDataOrUrl }
  61:     : { type: 'postback', label: button_label, data: btnDataOrUrl || 'fat', displayText: ALT_TEXT };
  62: 
  63:   return {
  64:     type: 'bubble',
  65:     size: 'micro',
  66:     hero: {
  67:       type: 'image',
  68:       url: image_url,
  69:       aspectMode: 'fit',
  70:       aspectRatio: '320:230',
  71:       size: 'full',
  72:     },
  73:     body: {
  74:       type: 'box',
  75:       layout: 'vertical',
  76:       contents: [
  77:         {
  78:           type: 'box',
  79:           layout: 'baseline',
  80:           contents: [
  81:             {
  82:               type: 'text',
  83:               text: brand,
  84:               size: 'md',
  85:               flex: 0,
  86:               weight: 'bold',
  87:               offsetTop: '2px',
  88:             },
  89:           ],
  90:           offsetBottom: '5px',
  91:         },
  92:         {
  93:           type: 'text',
  94:           text: model,
  95:           size: 'sm',
  96:           wrap: true,
  97:           offsetBottom: '5px',
  98:           offsetTop: '2px',
  99:         },
 100:         {
 101:           type: 'text',
 102:           size: 'sm',
 103:           wrap: true,
 104:           offsetBottom: '5px',
 105:           offsetTop: '2px',
 106:           text: subtitle || '   .',
 107:         },
 108:         {
 109:           type: 'box',
 110:           layout: 'baseline',
 111:           contents: [
 112:             {
 113:               type: 'text',
 114:               text: price,
 115:               color: '#EA4343',
 116:               weight: 'bold',
 117:               offsetTop: '5px',
 118:               offsetBottom: '5px',
 119:             },
 120:             ...(price_original
 121:               ? [{
 122:                   type: 'text',
 123:                   text: price_original,
 124:                   decoration: 'line-through',
 125:                   size: '14px',
 126:                   color: '#9E9E9E',
 127:                   offsetTop: '5px',
 128:                   offsetBottom: '5px',
 129:                 }]
 130:               : []),
 131:           ],
 132:           offsetBottom: '5px',
 133:           height: '30px',
 134:           offsetTop: '2px',
 135:         },
 136:         {
 137:           type: 'button',
 138:           style: 'primary',
 139:           color: '#FF7F50',
 140:           height: 'sm',
 141:           position: 'relative',
 142:           action,
 143:           offsetTop: '3px',
 144:         },
 145:       ],
 146:       spacing: 'sm',
 147:       paddingEnd: '10px',
 148:       paddingStart: '10px',
 149:     },
 150:     styles: {
 151:       body: {
 152:         separatorColor: '#FFECE6',
 153:         backgroundColor: '#FFECE6',
 154:       },
 155:     },
 156:   };
 157: }
 158: 
 159: function main() {
 160:   const CSV_PATH = CANDIDATE_CSV_PATHS.find(p => fs.existsSync(p));
 161:   if (!CSV_PATH) {
 162:     console.error(`CSV not found in: ${CANDIDATE_CSV_PATHS.join(', ')}`);
 163:     process.exit(1);
 164:   }
 165:   const text = fs.readFileSync(CSV_PATH, 'utf8');
 166:   const rows = parseCSV(text).filter(r => r.length && r.some(c => c.trim().length > 0));
 167:   if (rows.length < 2) {
 168:     console.error('CSV has no data rows');
 169:     process.exit(1);
 170:   }
 171:   const header = rows[0].map(h => h.trim());
 172:   const dataRows = rows.slice(1);
 173:   const recs = dataRows.map(cols => {
 174:     const obj = {};
 175:     header.forEach((h, idx) => { obj[h] = cols[idx] !== undefined ? cols[idx] : ''; });
 176:     const order = obj.order ? Number(obj.order) : undefined;
 177:     return { ...obj, __order: isNaN(order) ? undefined : order };
 178:   });
 179: 
 180:   recs.sort((a, b) => {
 181:     if (a.__order !== undefined && b.__order !== undefined) return a.__order - b.__order;
 182:     if (a.__order !== undefined) return -1;
 183:     if (b.__order !== undefined) return 1;
 184:     return 0;
 185:   });
 186: 
 187:   // take first 10 only (order first, then row order fallback)
 188:   const top = recs.slice(0, 10);
 189:   const altText = ALT_TEXT;
 190:   const bubbles = top.map(r => toBubble(r));
 191:   const message = {
 192:     type: 'flex',
 193:     altText,
 194:     contents: {
 195:       type: 'carousel',
 196:       contents: bubbles,
 197:     },
 198:   };
 199: 
 200:   // Ensure output directory exists
 201:   const dir = path.dirname(OUT_PATH);
 202:   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
 203:   fs.writeFileSync(OUT_PATH, JSON.stringify(message, null, 2), 'utf8');
 204:   console.log(`Wrote ${OUT_PATH} with ${bubbles.length} bubbles.`);
 205: }
 206: 
 207: main();
