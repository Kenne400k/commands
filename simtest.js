const fs = require("fs");
const axios = require("axios");
const path = require("path");
const config = require(path.join(__dirname, "../../config.json"));

const DATA_PATH = path.join(__dirname, "data/bot.json");
const GEMINI_API_KEY = "AIzaSyDV4U_yYa9i-4LGQmoh_qTaFmJR0HJnFcQ";

const ADMIN_ID = [...(config.ADMINBOT || []), ...(config.NDH || [])];

function loadData() {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            fs.writeFileSync(DATA_PATH, JSON.stringify({ conversations: {}, activeThreads: {} }, null, 2));
        }
        return JSON.parse(fs.readFileSync(DATA_PATH, "utf8").trim()) || { conversations: {}, activeThreads: {} };
    } catch (error) {
        console.error("Lỗi đọc file JSON, reset lại!", error);
        fs.writeFileSync(DATA_PATH, JSON.stringify({ conversations: {}, activeThreads: {} }, null, 2));
        return { conversations: {}, activeThreads: {} };
    }
}

let data = loadData();
const saveData = () => fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

function getFileSize() {
    const stats = fs.statSync(DATA_PATH);
    return (stats.size / 1024).toFixed(2) + " KB";
}

module.exports.config = {
    name: "sim",
    version: "4.2.0",
    hasPermission: 2,
    credits: "Pcoder",
    description: "Quản lý Sim chatbot",
    commandCategory: "No prefix",
    usages: "[on/off/list]",
    cooldowns: 1
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    if (!data.activeThreads) data.activeThreads = {};

    if (args.length === 0) {
        data.activeThreads[threadID] = !data.activeThreads[threadID];
        saveData();
        return api.sendMessage(
            `⚙️ Sim ${data.activeThreads[threadID] ? "ON ✅" : "OFF ❌"} trong nhóm này`,
            threadID,
            messageID
        );
    }

   const cmd = args[0].toLowerCase();

if (cmd === "on") {
    if (!ADMIN_ID.includes(senderID)) {
        return api.sendMessage("🚫 Mày đ** có quyền dùng lệnh này!", threadID, messageID);
    }
    data.activeThreads[threadID] = true;
    saveData();
    return api.sendMessage("✅ Sim đã bật cho nhóm này!", threadID, messageID);
}

if (cmd === "off") {
    if (!ADMIN_ID.includes(senderID)) {
        return api.sendMessage("🚫 Mày đ** có quyền dùng lệnh này!", threadID, messageID);
    }
    data.activeThreads[threadID] = false;
    saveData();
    return api.sendMessage("❌ Sim đã tắt trong nhóm này!", threadID, messageID);
}

if (cmd === "list") {
    if (!ADMIN_ID.includes(senderID)) {
        return api.sendMessage("🚫 Mày đ** có quyền dùng lệnh này!", threadID, messageID);
    }
    const list = await getActiveGroups(api);
    return api.sendMessage(list, threadID, messageID);
}

        const activeGroups = Object.keys(data.activeThreads);
        if (activeGroups.length === 0) 
            return api.sendMessage("📌 Không có nhóm nào đang bật Sim!", threadID, messageID);

        let list = `📜 **DANH SÁCH NHÓM BẬT/TẮT SIM** 📜\n💾 **Dung lượng data:** ${getFileSize()}\n\n`;
        let indexMap = {};

        for (let i = 0; i < activeGroups.length; i++) {
            try {
                const groupID = activeGroups[i];
                const threadInfo = await api.getThreadInfo(groupID);
                list += `🔹 **${i + 1}. ${threadInfo.threadName}**\n📍 ID: ${groupID}\n👥 Thành viên: ${threadInfo.participantIDs.length}\n🔥 Sim: ${data.activeThreads[groupID] ? "ON ✅" : "OFF ❌"}\n\n`;
                indexMap[i + 1] = groupID;
            } catch (err) {
                list += `🔹 **${i + 1}. Nhóm ID: ${activeGroups[i]}** (Không lấy được thông tin)\n🔥 Sim: ${data.activeThreads[groupID] ? "ON ✅" : "OFF ❌"}\n\n`;
                indexMap[i + 1] = activeGroups[i];
            }
        }

        return api.sendMessage(list, threadID, (err, info) => {
            if (!err) {
                global.client.handleReply.push({
                    name: module.exports.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    indexMap
                });
            }
        });
    }

module.exports.handleReply = async function ({ event, api, handleReply }) {
    const { body, threadID, messageID, senderID } = event;

    if (handleReply.author !== senderID) return;

    const input = body.trim().split(" ");
    const index = parseInt(input[0]);

    if (!handleReply.indexMap[index]) 
        return api.sendMessage("❌ Số thứ tự không hợp lệ!", threadID, messageID);

    const groupID = handleReply.indexMap[index];

    if (input.length === 1) {
        data.activeThreads[groupID] = !data.activeThreads[groupID];
    } else {
        const state = input[1].trim().toLowerCase();
        if (!["true", "false"].includes(state)) 
            return api.sendMessage("⚠️ Giá trị phải là true (bật) hoặc false (tắt)!", threadID, messageID);
        data.activeThreads[groupID] = state === "true";
    }

    saveData();

    api.sendMessage(
        `✅ **Admin đã cập nhật Sim:** ${data.activeThreads[groupID] ? "ON ✅" : "OFF ❌"}\n📌 **Nhóm ID:** ${groupID}\n sài lệnh _sim để tắt`,        groupID
    );

    return api.sendMessage(
        `✅ Đã cập nhật Sim: ${data.activeThreads[groupID] ? "ON ✅" : "OFF ❌"} cho nhóm ${groupID}`,
        threadID,
        messageID
    );
};

module.exports.handleEvent = async function ({ event, api }) {
    const { body, threadID, messageID, senderID } = event;

    if (!body || senderID === api.getCurrentUserID() || !data.activeThreads[threadID]) return;

    const input = body.trim().toLowerCase();

    if (data.conversations[input]) {
        return api.sendMessage(data.conversations[input], threadID, messageID);
    }

    const response = await askGemini(input);
    if (response) {
        data.conversations[input] = response;
        saveData();
        return api.sendMessage(response, threadID, messageID);
    } else {
        return api.sendMessage("❓ Tao éo biết, dạy tao lẹ!", threadID, (err, info) => {
            if (!err) {
                global.client.handleReply.push({
                    name: module.exports.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    question: input
                });
            }
        });
    }
};

async function askGemini(text) {
    try {
        const isTechQuestion = /code|lệnh|hàm|script|javascript|node\.js|lập trình|bug|sửa lỗi|API|framework|database|SQL|HTML|CSS|Python|C\+\+|Java/i.test(text);

        const prompt = isTechQuestion
            ? `Hãy trả lời một cách nghiêm túc, không tục tĩu, đúng trọng tâm câu hỏi: "${text}"`
            : `Trả lời ngắn gọn, thô tục nhưng không quá tục tĩu: "${text}"`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            },
            { headers: { "Content-Type": "application/json" } }
        );

        return response.data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (err) {
        console.error("❌ Lỗi gọi API Gemini:", err.response?.data || err.message);
        return null;
    }
}
