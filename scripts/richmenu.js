/*
 Rich Menu management script
 Usage examples:
  - node scripts/richmenu.js list
  - node scripts/richmenu.js delete-all
  - node scripts/richmenu.js deploy --dir richmenus --default bloodPressure
*/
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const line = require('@line/bot-sdk');

const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
if (!accessToken) {
  console.error('Missing env LINE_CHANNEL_ACCESS_TOKEN');
  process.exit(1);
}
const client = new line.Client({ channelAccessToken: accessToken });

const args = process.argv.slice(2);
const cmd = args[0];

function getArg(name, def) {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return def;
}

async function list() {
  const menus = await client.getRichMenuList();
  console.log(JSON.stringify(menus, null, 2));
}

async function deleteAll() {
  const menus = await client.getRichMenuList();
  for (const m of menus) {
    await client.deleteRichMenu(m.richMenuId);
    console.log('Deleted', m.name, m.richMenuId);
  }
}

async function createFromDir(dir) {
  const jsonPath = path.join(dir, 'menu.json');
  const imgPath = path.join(dir, 'image.png');
  if (!fs.existsSync(jsonPath)) throw new Error(`Missing ${jsonPath}`);
  if (!fs.existsSync(imgPath)) throw new Error(`Missing ${imgPath}`);

  const menu = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const richMenuId = await client.createRichMenu(menu);
  console.log('Created rich menu', menu.name, richMenuId);

  const imageStream = fs.createReadStream(imgPath);
  await client.setRichMenuImage(richMenuId, imageStream, 'image/png');
  console.log('Uploaded image for', richMenuId);
  return { name: menu.name, id: richMenuId };
}

async function deployAll(rootDir, defaultName) {
  const subdirs = fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(rootDir, d.name));

  const created = [];
  for (const d of subdirs) {
    const result = await createFromDir(d);
    created.push(result);
  }

  const defaultItem = created.find((c) => c.name === defaultName) || created[0];
  if (defaultItem) {
    await client.setDefaultRichMenu(defaultItem.id);
    console.log('Set default rich menu:', defaultItem.name, defaultItem.id);
  }
}

(async () => {
  try {
    if (cmd === 'list') {
      await list();
    } else if (cmd === 'delete-all') {
      await deleteAll();
    } else if (cmd === 'deploy') {
      const dir = getArg('dir', 'richmenus');
      const def = getArg('default');
      await deployAll(dir, def);
    } else {
      console.log('Commands: list | delete-all | deploy --dir <dir> [--default <name>]');
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

