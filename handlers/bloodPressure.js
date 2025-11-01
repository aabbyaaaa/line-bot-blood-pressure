const fs = require("fs");
const path = require("path");

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
  const filePath = path.join(__dirname, "..", "bloodPressure", "flex_fat.json");
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const msg = JSON.parse(raw);
    return chunkFlexIfNeeded(msg);
  } catch (e) {
    console.error("Failed to load flex_fat.json", e);
    return { type: "text", text: "內容暫時無法顯示，請稍後再試。" };
  }
}

module.exports = {
  handleFat,
};

