// Build bloodPressure/flex_fat.json from richmenus/bloodPressure/flex_fat.csv
// CSV header expected:
// image_url,brand,model,subtitle,price,price_original,button_type,button_label,button_data_or_url,order,altText

const fs = require('fs');
const path = require('path');

const CANDIDATE_CSV_PATHS = [
  path.join('bloodPressure', 'flex_fat.csv'),
  path.join('richmenus', 'bloodPressure', 'flex_fat.csv'),
];
const OUT_PATH = path.join('bloodPressure', 'flex_fat.json');

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
      // handle CRLF/ LF
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = ''; rows.push(row); row = []; i++; continue;
    }
    field += ch; i++;
  }
  // last field
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function toBubble(rec) {
  const image_url = rec.image_url?.trim();
  const brand = rec.brand?.trim();
  const model = rec.model?.trim();
  const subtitle = (rec.subtitle ?? '').trim();
  const price = rec.price?.trim();
  const price_original = (rec.price_original ?? '').trim();
  const button_type = (rec.button_type ?? 'postback').trim();
  const button_label = (rec.button_label ?? '了解更多').trim();
  const btnDataOrUrl = (rec.button_data_or_url ?? '').trim();

  const action = button_type === 'uri'
    ? { type: 'uri', label: button_label, uri: btnDataOrUrl }
    : { type: 'postback', label: button_label, data: btnDataOrUrl || 'fat' };

  return {
    type: 'bubble',
    size: 'micro',
    hero: {
      type: 'image',
      url: image_url,
      aspectMode: 'fit',
      aspectRatio: '320:230',
      size: 'full',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'baseline',
          contents: [
            {
              type: 'text',
              text: brand,
              size: 'md',
              flex: 0,
              weight: 'bold',
              offsetTop: '2px',
            },
          ],
          offsetBottom: '5px',
        },
        {
          type: 'text',
          text: model,
          size: 'sm',
          wrap: true,
          offsetBottom: '5px',
          offsetTop: '2px',
        },
        {
          type: 'text',
          size: 'sm',
          wrap: true,
          offsetBottom: '5px',
          offsetTop: '2px',
          text: subtitle || '   .',
        },
        {
          type: 'box',
          layout: 'baseline',
          contents: [
            {
              type: 'text',
              text: price,
              color: '#EA4343',
              weight: 'bold',
              offsetTop: '5px',
              offsetBottom: '5px',
            },
            ...(price_original
              ? [{
                  type: 'text',
                  text: price_original,
                  decoration: 'line-through',
                  size: '14px',
                  color: '#9E9E9E',
                  offsetTop: '5px',
                  offsetBottom: '5px',
                }]
              : []),
          ],
          offsetBottom: '5px',
          height: '30px',
          offsetTop: '2px',
        },
        {
          type: 'button',
          style: 'primary',
          color: '#FF7F50',
          height: 'sm',
          position: 'relative',
          action,
          offsetTop: '3px',
        },
      ],
      spacing: 'sm',
      paddingEnd: '10px',
      paddingStart: '10px',
    },
    styles: {
      body: {
        separatorColor: '#FFECE6',
        backgroundColor: '#FFECE6',
      },
    },
  };
}

function main() {
  const CSV_PATH = CANDIDATE_CSV_PATHS.find(p => fs.existsSync(p));
  if (!CSV_PATH) {
    console.error(`CSV not found in: ${CANDIDATE_CSV_PATHS.join(', ')}`);
    process.exit(1);
  }
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(text).filter(r => r.length && r.some(c => c.trim().length > 0));
  if (rows.length < 2) {
    console.error('CSV has no data rows');
    process.exit(1);
  }
  const header = rows[0].map(h => h.trim());
  const dataRows = rows.slice(1);
  const recs = dataRows.map(cols => {
    const obj = {};
    header.forEach((h, idx) => { obj[h] = cols[idx] !== undefined ? cols[idx] : ''; });
    const order = obj.order ? Number(obj.order) : undefined;
    return { ...obj, __order: isNaN(order) ? undefined : order };
  });

  recs.sort((a, b) => {
    if (a.__order !== undefined && b.__order !== undefined) return a.__order - b.__order;
    if (a.__order !== undefined) return -1;
    if (b.__order !== undefined) return 1;
    return 0;
  });

  const altText = (recs.find(r => (r.altText || '').trim().length > 0)?.altText || '體脂計加價購，最低69折起').trim();
  const bubbles = recs.map(r => toBubble(r));
  const message = {
    type: 'flex',
    altText,
    contents: {
      type: 'carousel',
      contents: bubbles,
    },
  };

  // Ensure output directory exists
  const dir = path.dirname(OUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(message, null, 2), 'utf8');
  console.log(`Wrote ${OUT_PATH} with ${bubbles.length} bubbles.`);
}

main();
