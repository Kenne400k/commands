const axios = require('axios');
const fs = require('fs');

let path = __dirname + '/data/bot.json';
let data = {};
let save = _ => fs.writeFileSync(path, JSON.stringify(data));

if (!fs.existsSync(path)) save();
data = JSON.parse(fs.readFileSync(path));

module.exports = {
  config: {
    name: "sim",
    version: "2.0.0",
    hasPermission: 1,
    credits: "L.V. Bằng, Updated by Pcoder",
    description: "Auto trả lời người dùng bằng SimSimi API",
    commandCategory: "No prefix",
    usages: "",
    cooldowns: 1,
  },

  run: ({ event, api }) => {
    let t = event.threadID;
    data[t] = data[t] === undefined ? false : !data[t];
    save();
    api.sendMessage(`✅ ` + (data[t] ? 'Bật' : 'Tắt') + ` sim thành công`, t);
  },

  sim: async function (text) {
    const url = 'https://api.simsimi.vn/v1/simtalk';
    const params = new URLSearchParams();
    params.append("text", text);
    params.append("lc", "vn");  // Ngôn ngữ Tiếng Việt
    params.append("version", "v1"); // Phiên bản API

    try {
      const response = await axios.post(url, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return response.data.message || 'Không biết trả lời sao!';
    } catch (err) {
      console.error(err);
      return err.response?.data?.message || "API lỗi, thử lại sau!";
    }
  },

  handleEvent: async function ({ event, api }) {
    if (event.senderID == api.getCurrentUserID()) return;
    if (data[event.threadID] === false) return;

    if (event.body && event.body.toLowerCase().includes('bot') && !event.messageReply) {
      const answer = await this.sim(event.body);
      api.sendMessage({
        body: answer && answer.includes("Tôi không biết làm thế nào để trả lời.") 
          ? "Mày nói cái gì vậy?" 
          : answer,
      }, event.threadID, (err, info) => {
        if (err) console.error(err);
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID
        });
      }, event.messageID);
    }
  },

  handleReply: async function ({ event, api }) {
    if (event.senderID == api.getCurrentUserID()) return;
    const answer = await this.sim(event.body);
    api.sendMessage({
      body: answer && answer.includes("Tôi không biết làm thế nào để trả lời.") 
        ? "Mày nói cái gì vậy?" 
        : answer,
    }, event.threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID
      });
    }, event.messageID);
  }
};
