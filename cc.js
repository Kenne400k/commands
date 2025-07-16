const fs = require("fs");
const path = require("path");

// === Đường dẫn lưu trạng thái bật/tắt và link ===
const statePath = path.join(__dirname, "../../luulink_state.json");
const linkFile = path.join(__dirname, "../../link.txt");

// Khởi tạo trạng thái on/off cho nhóm
let stateData = {};
if (fs.existsSync(statePath)) {
  try {
    stateData = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    stateData = {};
  }
}

// Regex bắt link (hỗ trợ cả link không có http/https ở đầu, vd: cheotuongtac.net)
const LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/\S*)?)/gi;

// Lưu trạng thái on/off cho nhóm
function setState(threadID, onoff) {
  stateData[threadID] = onoff;
  fs.writeFileSync(statePath, JSON.stringify(stateData, null, 2));
}

// Lấy trạng thái nhóm
function getState(threadID) {
  // Mặc định là bật nếu chưa có trạng thái
  return stateData[threadID] !== false;
}

// Lưu link vào file
function saveLink(threadName, senderName, link, threadID) {
  const time = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const line = `[${threadName}] | [${senderName}] | ${link} | ${threadID} | ${time}\n`;
  fs.appendFileSync(linkFile, line, "utf8");
}

module.exports.config = {
  name: "luulink",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "pcoder, Kenne400k",
  description: "Tự động lưu link gửi vào nhóm, kể cả link không có http/https. Dùng lệnh on/off để bật tắt.",
  commandCategory: "Tiện ích",
  usages: "[on | off]",
  cooldowns: 2
};

module.exports.run = async function({ api, event, args }) {
  // Chỉ admin bot mới được phép bật/tắt
  const ADMINBOT = global.config.ADMINBOT || [];
  if (!ADMINBOT.includes(event.senderID))
    return api.sendMessage("Bạn không có quyền dùng lệnh này!", event.threadID, event.messageID);

  if (!args[0] || !["on", "off"].includes(args[0].toLowerCase()))
    return api.sendMessage("Dùng: luulink on/off", event.threadID, event.messageID);

  setState(event.threadID, args[0].toLowerCase() === "on");
  api.sendMessage(
    `Đã ${args[0].toLowerCase() === "on" ? "bật" : "tắt"} tự động lưu link cho nhóm này.`,
    event.threadID,
    event.messageID
  );
};

// === Xử lý sự kiện tin nhắn để lưu link tự động ===
module.exports.handleEvent = async function({ api, event }) {
  if (!event.body) return;
  // Kiểm tra trạng thái nhóm, mặc định bật
  if (!getState(event.threadID)) return;

  // Lấy tất cả link (cả link có http(s), cả tên miền không có http)
  const links = [];
  let match;
  while ((match = LINK_REGEX.exec(event.body)) !== null) {
    // match[0] là toàn bộ link bắt được (có thể là http://..., hoặc chỉ tên miền)
    links.push(match[0]);
  }
  if (links.length === 0) return;

  // Lấy tên nhóm và tên người gửi
  let threadName = "Unknown Group", senderName = "Unknown User";
  try {
    const threadInfo = await api.getThreadInfo(event.threadID);
    threadName = threadInfo.threadName || "NoName";
  } catch {}
  try {
    const userInfo = await api.getUserInfo(event.senderID);
    senderName = userInfo[event.senderID]?.name || "NoName";
  } catch {}

  for (const link of links) {
    saveLink(threadName, senderName, link, event.threadID);
  }

  api.sendMessage("Đã bú link này rồi nhé!", event.threadID, event.messageID);
};
