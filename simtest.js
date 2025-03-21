const axios = require("axios");
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "simConfig.json");

// Đọc trạng thái SimSimi từ file, nếu chưa có thì tạo mới
let simStatus = {};
if (fs.existsSync(configPath)) {
    try {
        simStatus = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch (error) {
        console.error("❌ Lỗi khi đọc file simConfig.json:", error.message);
        simStatus = {};
    }
}

module.exports.config = {
    name: "sim",
    version: "2.0.1",
    hasPermission: 0,
    credits: "Pcoder",
    description: "Bật/tắt SimSimi hoặc chat với nó",
    commandCategory: "Chatbot",
    usages: "/sim on/off hoặc chat trực tiếp nếu đã bật",
    cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
    const threadID = event.threadID;
    const command = args[0]?.toLowerCase();

    if (command === "on") {
        simStatus[threadID] = true;
        fs.writeFileSync(configPath, JSON.stringify(simStatus, null, 2));
        return api.sendMessage("✅ SimSimi đã được bật! Tôi sẽ tự động trả lời tin nhắn.", threadID, event.messageID);
    }

    if (command === "off") {
        simStatus[threadID] = false;
        fs.writeFileSync(configPath, JSON.stringify(simStatus, null, 2));
        return api.sendMessage("❌ SimSimi đã tắt! Tôi sẽ không phản hồi nữa.", threadID, event.messageID);
    }

    return api.sendMessage("⚠ Sử dụng: /sim on để bật hoặc /sim off để tắt.", threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, body, senderID } = event;

    // Kiểm tra nếu SimSimi đang tắt hoặc tin nhắn đến từ bot thì bỏ qua
    if (!simStatus[threadID] || !body || senderID === api.getCurrentUserID()) return;

    const apiKey = "MXFHQsnhRv0-QYcMfnCg~5s.mneSTpdtkBl-DTmF"; 
    const apiUrl = "https://wsapi.simsimi.com/190410/talk";

    try {
        const response = await axios.post(apiUrl, {
            utext: body,
            lang: "vi"
        }, {
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
            }
        });

        if (response.data && response.data.atext) {
            return api.sendMessage(`🤖 SimSimi: ${response.data.atext}`, threadID, event.messageID);
        }
    } catch (error) {
        console.error("❌ Lỗi API SimSimi:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        return api.sendMessage("⚠ SimSimi gặp lỗi khi phản hồi. Vui lòng thử lại sau!", threadID);
    }
};

module.exports.handleEvent.eventType = ["message"];
