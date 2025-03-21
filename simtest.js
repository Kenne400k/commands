const axios = require('axios');
const fs = require('fs');

const GEMINI_API_KEY = "AIzaSyDV4U_yYa9i-4LGQmoh_qTaFmJR0HJnFcQ"; // Thay bằng API key của mày
const PATH = __dirname + "/data/bot.json";
let data = {};

// Đọc dữ liệu từ file JSON, nếu không có thì tạo mới
if (!fs.existsSync(PATH)) {
    fs.writeFileSync(PATH, JSON.stringify({ learn: true, conversations: {} }));
}
data = JSON.parse(fs.readFileSync(PATH));

// Hàm lưu dữ liệu
const saveData = () => fs.writeFileSync(PATH, JSON.stringify(data, null, 2));

module.exports = {
    config: {
        name: "sim",
        version: "2.0.0",
        hasPermission: 1,
        credits: "Pcoder",
        description: "Chatbot AI tự học hỏi",
        commandCategory: "No prefix",
        usages: "",
        cooldowns: 1,
    },

    run: ({ event, api }) => {
        let t = event.threadID;
        data.learn = !data.learn;  // Bật/tắt chế độ học
        saveData();
        api.sendMessage(`✅ Chế độ học hỏi đã ${data.learn ? "BẬT" : "TẮT"}`, t);
    },

    handleEvent: async function ({ event, api }) {
        if (event.senderID == api.getCurrentUserID()) return;
        let { body, threadID, messageID, senderID } = event;
        if (!body) return;

        // Kiểm tra xem bot có câu trả lời không
        if (data.conversations[body]) {
            api.sendMessage(data.conversations[body], threadID, messageID);
            return;
        }

        // Nếu không có, hỏi AI Gemini
        const response = await askGemini(body);
        if (response) {
            api.sendMessage(response, threadID, messageID);

            // Nếu chế độ học bật, lưu vào bot.json
            if (data.learn) {
                data.conversations[body] = response;
                saveData();
            }
        } else {
            api.sendMessage("Tao chưa biết câu này, dạy tao đi! (Trả lời tin nhắn này với câu trả lời)", threadID, (err, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    question: body
                });
            });
        }
    },

    handleReply: async function ({ event, api, handleReply }) {
        let { body, threadID, messageID, senderID } = event;
        if (handleReply.author !== senderID) return;

        // Lưu câu trả lời vào bot.json
        data.conversations[handleReply.question] = body;
        saveData();
        api.sendMessage("✅ Tao đã nhớ câu này!", threadID, messageID);
    }
};

// Hàm gọi API Gemini
async function askGemini(text) {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta3/models/gemini-pro:generateText?key=${GEMINI_API_KEY}`,
            {
                prompt: { text },
                temperature: 0.7
            }
        );
        return response.data.candidates?.[0]?.output || null;
    } catch (err) {
        console.error(err);
        return null;
    }
}
