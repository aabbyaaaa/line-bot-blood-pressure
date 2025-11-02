// Build bloodPressure/flex_blood.json from bloodPressure/flex_blood.csv
// CSV header expected (one line):
// id,category,image_url,badge_text,badge_bg_color,brand,title,subtitle,price,price_original,button_type,button_label,button_data_or_url,button_display_text,button_color,order,alt_text

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join('bloodPressure', 'flex_blood.csv');
const OUT_PATH = path.join('bloodPressure', 'flex_blood.json');

function parseCSV(text) {
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      } else { field += ch; i++; continue; }
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ',') { row.push(field); field = ''; i++; continue; }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = ''; rows.push(row); row = []; i++; continue;
    }
    field += ch; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length && r.some(c => (c||'').trim().length>0));
}

function ensureDollar(s) {
  if (!s) return s;
  const t = String(s).trim();
  if (!t) return t;
  return t.startsWith('$') ? t : `$${t}`;
}

function buildBadge(badge_text, badge_bg_color) {
  if (!badge_text || !badge_text.trim()) return null;
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [{ type: 'text', text: badge_text.trim(), size: 'xs', color: '#ffffff', align: 'center', gravity: 'center' }],
    position: 'absolute', flex: 0, width: '60px', height: '25px',
    backgroundColor: badge_bg_color && badge_bg_color.trim() ? badge_bg_color.trim() : '#EC3D44',
    cornerRadius: '100px', offsetTop: '18px', offsetStart: '10px',
    paddingAll: '2px', paddingStart: '4px', paddingEnd: '4px',
  };
}

function toBubble(rec) {
  const id = (rec.id || '').trim();
  const category = (rec.category || '').trim();
  const image_url = (rec.image_url || '').trim();
  const badge_text = (rec.badge_text || '').trim();
  const badge_bg_color = (rec.badge_bg_color || '').trim();
  const brand = (rec.brand || '').trim();
  const title = (rec.title || '').trim();
  const subtitle = (rec.subtitle || '').trim();
  const price = ensureDollar((rec.price || '').trim());
  const price_original = ensureDollar((rec.price_original || '').trim());
  const button_type = ((rec.button_type || 'postback')).trim().toLowerCase();
  const button_label = (rec.button_label || '了解更多').trim();
  const button_data_or_url = (rec.button_data_or_url || '').trim();
  const button_display_text = (rec.button_display_text || '').trim();
  const button_color = (rec.button_color || '#005eb8').trim();

  const action = button_type === 'uri'
    ? { type: 'uri', label: button_label, uri: button_data_or_url }
    : { type: 'postback', label: button_label, data: (button_data_or_url || (id ? `bp:sku=${id}` : 'bp')) };
  if (button_type !== 'uri' && button_display_text) action.displayText = button_display_text;

  const badge = buildBadge(badge_text, badge_bg_color);

  return {
    _id: id,
    _category: category,
    type: 'bubble',
    size: 'deca',
    header: {
      type: 'box', layout: 'vertical', contents: [
        { type: 'image', url: image_url, size: 'full', aspectRatio: '320:220', aspectMode: 'fit' },
        ...(badge ? [badge] : []),
      ],
    },
    body: {
      type: 'box', layout: 'vertical', contents: [
        { type: 'box', layout: 'baseline', contents: [ { type: 'text', text: brand, size: 'md', flex: 0, weight: 'bold' } ], offsetBottom: '5px' },
        { type: 'text', text: title, size: 'sm', wrap: true, offsetBottom: '5px' },
        ...(subtitle ? [ { type: 'text', text: subtitle, size: 'sm', wrap: true, offsetBottom: '5px' } ] : []),
        { type: 'box', layout: 'baseline', contents: [
            { type: 'text', text: price, color: '#EA4343', weight: 'bold', offsetTop: '5px', offsetBottom: '5px' },
            ...(price_original ? [{ type: 'text', text: price_original, decoration: 'line-through', size: '14px', color: '#9E9E9E', offsetTop: '5px', offsetBottom: '5px' }] : []),
          ],
          offsetBottom: '5px', height: '28px'
        },
        { type: 'button', style: 'primary', color: button_color, height: 'sm', position: 'relative', action, offsetTop: '5px' },
      ], spacing: 'sm', paddingEnd: '15px', paddingStart: '15px'
    },
    styles: { body: { separatorColor: '#E6F3FF', backgroundColor: '#E6F3FF' } },
  };
}

function stripInternal(bubbles) {
  return bubbles.map(b => {
    const c = JSON.parse(JSON.stringify(b));
    delete c._id; delete c._category;
    return c;
  });
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found: ${CSV_PATH}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(raw);
  if (rows.length < 2) { console.error('CSV has no data rows'); process.exit(1); }
  const header = rows[0].map(h => h.trim());
  const data = rows.slice(1).map(cols => {
    const o = {}; header.forEach((h, i) => o[h] = cols[i] ?? '');
    const ord = o.order ? Number(o.order) : undefined; o.__order = isNaN(ord) ? undefined : ord; return o;
  });
  // sort by order then row order
  const sorted = data.slice().sort((a,b)=>{
    if (a.__order!=null && b.__order!=null) return a.__order-b.__order;
    if (a.__order!=null) return -1; if (b.__order!=null) return 1; return 0;
  });
  const altText = (sorted.find(r => (r.alt_text||'').trim())?.alt_text || '血壓計商品').trim();
  const bubblesRaw = sorted.map(toBubble);
  const bubblesOut = stripInternal(bubblesRaw);
  const message = { type: 'flex', altText, contents: { type: 'carousel', contents: bubblesOut } };
  fs.writeFileSync(OUT_PATH, JSON.stringify(message, null, 2), 'utf8');

  // Build category index for runtime filtering without reading CSV
  const indexByCategory = {};
  const categories = ['omron_arm','omron_other','citizen_bp','nissei_bp'];
  for (const cat of categories) indexByCategory[cat] = [];
  bubblesRaw.forEach((b, i) => {
    const cat = (b._category || '').trim();
    if (cat && indexByCategory[cat]) indexByCategory[cat].push(i);
  });
  const idxOutPath = path.join('bloodPressure', 'flex_blood_index.json');
  fs.writeFileSync(idxOutPath, JSON.stringify({ altText, categories: indexByCategory }, null, 2), 'utf8');

  console.log(`Wrote ${OUT_PATH} with ${bubblesOut.length} bubbles. Index saved to ${idxOutPath}.`);
}

main();
