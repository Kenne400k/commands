const fs = require("fs");

let path = __dirname + "/data/bot.json";
let data = {};

// Hàm lưu dữ liệu vào file
let save = () => fs.writeFileSync(path, JSON.stringify(data, null, 2));

// Kiểm tra file có tồn tại không, nếu không thì tạo file mới
if (!fs.existsSync(path)) {
  save();
} else {
  try {
    data = JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (err) {
    console.error("Lỗi đọc file bot.json, reset lại:", err);
    data = {};
    save();
  }
}

module.exports = {
  config: {
    name: "sim",
    version: "3.0.0",
    hasPermission: 1,
    credits: "Pcoder",
    description: "Chat bot tự học từ dữ liệu người dùng",
    commandCategory: "No prefix",
    usages: "",
    cooldowns: 1,
  },

  run: ({ event, api }) => {
    let t = event.threadID;
    data[t] = data[t] === undefined ? true : !data[t];

    save();
    api.sendMessage(`✅ Sim đã ${data[t] ? "BẬT" : "TẮT"} trong nhóm này`, t);
  },

  sim: async function (text) {
    text = text.toLowerCase().trim();
    if (data[text]) {
      return data[text]; // Nếu đã học, trả lời theo dữ liệu đã học
    } else {
      return "Tao chưa biết câu này, dạy tao đi! (Trả lời tin nhắn này để dạy tao)";
    }
  },

  handleEvent: async function ({ event, api }) {
    if (event.senderID == api.getCurrentUserID()) return;
    if (!data[event.threadID]) return;

    if (event.body && !event.messageReply) {
      const answer = await this.sim(event.body);
      api.sendMessage(answer, event.threadID, (err, info) => {
        if (!data[event.body.toLowerCase().trim()]) {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            question: event.body.toLowerCase().trim(),
          });
        }
      });
    }
  },

  handleReply: async function ({ event, api, handleReply }) {
    if (event.senderID == api.getCurrentUserID()) return;
    let { question } = handleReply;

    // Lưu câu trả lời vào dữ liệu
    data[question] = event.body;
    save();

    api.sendMessage(`✅ Đã học câu: "${question}" -> "${event.body}"`, event.threadID);
  },
};
