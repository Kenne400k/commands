const axios = require('axios');
const fs = require('fs');

const API_KEY = "MXFHQsnhRv0-QYcMfnCg~5s.mneSTpdtkBl-DTmF"; // Key API SimSimi
const API_URL = "https://wsapi.simsimi.com/190410/talk";

let path = __dirname + '/data/bot.json';
let data = {};
let save = () => fs.writeFileSync(path, JSON.stringify(data));

if (!fs.existsSync(path)) save();
data = JSON.parse(fs.readFileSync(path));

module.exports = {
  config: {
    name: "sim",
    version: "1.0.0",
    hasPermission: 1,
    credits: "Pcoder",
    description: "Auto trả lời người dùng",
    commandCategory: "No prefix",
    usages: "",
    cooldowns: 1,
  },

  run: ({ event, api }) => {
    let t = event.threadID;
    data[t] = data[t] === undefined ? false : !data[t];
    save();
    api.sendMessage(`✅ ` + (data[t] ? 'Bật' : 'Tắt') + ` SimSimi thành công`, t);
  },

  sim: async function (text, lang = "vi") {
    try {
      const response = await axios.post(
        API_URL,
        { utext: text, lang: lang },
        { headers: { "x-api-key": API_KEY, "Content-Type": "application/json" } }
      );

      return response.data.atext || "Tôi không hiểu câu hỏi của bạn.";
    } catch (err) {
      console.error("Lỗi gọi API SimSimi:", err.message);
      return "Sim bị lỗi rồi!";
    }
  },

  handleEvent: async function ({ event, api }) {
    if (event.senderID == api.getCurrentUserID()) return;
    if (data[event.threadID] === false) return;

    if (event.body) {
      const answer = await this.sim(event.body);
      api.sendMessage(
        {
          body: answer.includes("Tôi không biết làm thế nào để trả lời.") ? "Mày nói cái đéo gì vậy?" : answer,
        },
        event.threadID,
        (err, info) => {
          if (err) console.error(err);
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
          });
        },
        event.messageID
      );
    }
  },

  handleReply: async function ({ event, api }) {
    if (event.senderID == api.getCurrentUserID()) return;

    const answer = await this.sim(event.body);
    api.sendMessage(
      {
        body: answer.includes("Tôi không biết làm thế nào để trả lời.") ? "Mày nói cái đéo gì vậy?" : answer,
      },
      event.threadID,
      (err, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
        });
      },
      event.messageID
    );
  },
};
