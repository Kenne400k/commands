const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const DKUPLOAD = path.join(__dirname, "../../pdata/dkupload.json");

module.exports.config = {
  name: "dkupload",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Pcoder",
  description: "upload video,jpg,... lên web dkupload.site",
  commandCategory: "Tiện ích",
  usages: "[reply video/ảnh]",
  cooldowns: 0
};

async function save(obj) {
  let data = [];
  try {
    if (await fs.pathExists(DKUPLOAD)) data = await fs.readJson(DKUPLOAD);
  } catch (e) {}
  data.push(obj);
  await fs.writeJson(DKUPLOAD, data, { spaces: 2 });
}

module.exports.run = async function({ api, event }) {
  try {
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0)
      return api.sendMessage("⚠️ Bạn phải reply vào một video hoặc ảnh!", event.threadID, event.messageID);

    const attachment = event.messageReply.attachments[0];
    if (!["photo", "video", "animated_image", "audio"].includes(attachment.type))
      return api.sendMessage("⚠️ Chỉ hỗ trợ reply ảnh, video, gif hoặc audio công khai!", event.threadID, event.messageID);

    const url = attachment.url;
    if (!url) return api.sendMessage("❌ Không lấy được URL file!", event.threadID, event.messageID);

    const encodedUrl = encodeURIComponent(url);
    const res = await axios.get(`https://dkupload.site/api/convert?url=${encodedUrl}`);

    if (res.data && res.data.success) {
      const { originalUrl, convertedUrl } = res.data;
      await save({
        user: event.senderID,
        thread: event.threadID,
        time: Date.now(),
        originalUrl,
        convertedUrl: `https://dkupload.site${convertedUrl}`,
        type: attachment.type
      });

      return api.sendMessage(
        `✅ Upload thành công!\n\n🌐 URL gốc:\n${originalUrl}\n\n🔗 URL mới:\nhttps://dkupload.site${convertedUrl}`,
        event.threadID,
        event.messageID
      );
    } else {
      let errMsg = "❌ Upload thất bại.";
      if (res.data && res.data.error) errMsg += `\nLý do: ${res.data.error}`;
      return api.sendMessage(errMsg, event.threadID, event.messageID);
    }
  } catch (e) {
    return api.sendMessage(
      `❌ Đã xảy ra lỗi khi upload!\n${e.message}`,
      event.threadID,
      event.messageID
    );
  }
};
