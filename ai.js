module.exports.config = {
    name: "ai",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Phát (Pcoder)",
    description: "Lệnh gọi API Gemini",
    commandCategory: "Utility",
    usages: "gemini <input_text>",
    cooldowns: 5
};

const axios = require('axios');
const fs = require('fs');
const path = __dirname + '/cache/gemini-response.json';

module.exports.run = async function ({ api, event, args }) {
    if (args.length == 0) {
        api.sendMessage('Vui lòng nhập yêu cầu!', event.threadID, event.messageID);
        return;
    }

    const inputText = args.join(" ");
    const apiKey = ""; // Thay bằng API key của bạn
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
        "contents": [
            {
                "parts": [
                    {"text": inputText}
                ]
            }
        ]
    };

    const headers = {
        "Content-Type": "application/json"
    };

    try {
        // Gọi API Gemini
        const response = await axios.post(url, payload, { headers });

        // Kiểm tra kết quả API trả về
        if (response.status === 200) {
            const result = response.data;
            console.log("Kết quả trả về từ Gemini API:", result);
            api.sendMessage(`${result.candidates[0].content.parts[0].text}`, event.threadID, event.messageID);
        } else {
            throw new Error(`Lỗi từ API: ${response.status}`);
        }
    } catch (error) {
        console.error("Đã xảy ra lỗi khi gọi API Gemini:", error);
        api.sendMessage("Đã có lỗi xảy ra, vui lòng thử lại sau!", event.threadID, event.messageID);
    }
};
