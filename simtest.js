const axios = require('axios');
const fs = require('fs');

const GEMINI_API_KEY = "AIzaSyDV4U_yYa9i-4LGQmoh_qTaFmJR0HJnFcQ";
const PATH = __dirname + "/data/bot.json";
let data = {};

// Đọc dữ liệu từ file JSON, nếu chưa có thì tạo mới
if (!fs.existsSync(PATH)) {
    fs.writeFileSync(PATH, JSON.stringify({ conversations: {} }));
}
data = JSON.parse(fs.readFileSync(PATH));

// Hàm lưu dữ liệu
const saveData = () => fs.writeFileSync(PATH, JSON.stringify(data, null, 2));

module.exports = {
    config: {
        name: "sim",
        version: "3.0.0",
        hasPermission: 1,
        credits: "Pcoder",
        description: "Chatbot AI kết hợp Gemini",
        commandCategory: "No prefix",
        usages: "",
        cooldowns: 1,
    },

    handleEvent: async function ({ event, api }) {
        if (event.senderID == api.getCurrentUserID()) return;
        let { body, threadID, messageID } = event;
        if (!body) return;

        body = body.trim().toLowerCase(); // Chuẩn hóa input

        // Kiểm tra bot đã biết chưa
        if (data.conversations[body]) {
            api.sendMessage(data.conversations[body], threadID, messageID);
            return;
        }

        // Hỏi Gemini nếu chưa có câu trả lời
        const response = await askGemini(body);
        if (response) {
            data.conversations[body] = response;
            saveData();
            api.sendMessage(response, threadID, messageID);
        } else {
            api.sendMessage("Tao không biết câu này, dạy tao đi!", threadID, (err, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    question: body
                });
            });
        }
    },

    handleReply: async function ({ event, api, handleReply }) {
        let { body, threadID, messageID, senderID } = event;
        if (handleReply.author !== senderID) return;

        // Lưu câu trả lời vào data
        data.conversations[handleReply.question] = body;
        saveData();
        api.sendMessage("✅ Tao đã nhớ câu này!", threadID, messageID);
    }
};

// Hàm hỏi Gemini với phản hồi ngắn gọn
async function askGemini(text) {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta3/models/gemini-pro:generateText?key=${GEMINI_API_KEY}`,
            {
                prompt: {
                    text: `Trả lời ngắn gọn nhất có thể cho câu sau: "${text}"`
                },
                temperature: 0.5
            }
        );
        return response.data.candidates?.[0]?.output || null;
    } catch (err) {
        console.error(err);
        return null;
    }
}
