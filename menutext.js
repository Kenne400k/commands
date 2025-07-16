const fs = require('fs');
const path = require('path');

function getPrefix() {
    try {
        const configPath = path.join(__dirname, '../../config.json');
        const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (typeof configData.PREFIX === 'string') return configData.PREFIX;
        if (Array.isArray(configData.PREFIX) && configData.PREFIX.length > 0) return configData.PREFIX[0];
    } catch {}
    return ".";
}

function TextPr(permission) {
    return permission == 0 ? "Thành viên"
        : permission == 1 ? "Quản trị viên"
        : permission == 2 ? "Admin bot"
        : "Toàn quyền";
}

module.exports.config = {
    name: "menu",
    version: "3.7.0",
    hasPermssion: 0,
    credits: "pcoder",
    description: "Menu text phân nhóm lệnh hiện đại, trả lời số để xem lệnh trong nhóm đó, hoặc all để xem toàn bộ lệnh",
    commandCategory: "Người dùng",
    usages: ".../tên lệnh/all",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {
    const PREFIX = getPrefix();
    const cmds = global.client.commands;
    const tid = event.threadID, mid = event.messageID;

    let byCategory = {};
    for (const cmd of cmds.values()) {
        const cat = cmd.config.commandCategory || "Khác";
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(cmd);
    }
    const categories = Object.keys(byCategory)
        .sort((a, b) => byCategory[b].length - byCategory[a].length || a.localeCompare(b, 'vi'));

    let msg = "MENU NHÓM LỆNH BOT\n━━━━━━━━━━━━━━━━━━━━━━\n";
    msg += `Chọn nhóm lệnh bằng cách reply số thứ tự (1,2,3...) hoặc nhập "${PREFIX}menu all" để xem toàn bộ lệnh.\n\n`;
    categories.forEach((cat, idx) => {
        msg += `${idx + 1}. ${cat} (${byCategory[cat].length} lệnh)\n`;
    });
    msg += "\n━━━━━━━━━━━━━━━━━━━━━━\n";
    msg += `💡 Reply/phản hồi số để xem danh sách lệnh của nhóm đó, hoặc gửi "${PREFIX}menu all" để hiện tất cả lệnh.`;

    api.sendMessage(msg, tid, (err, info) => {
        if (!err && info) {
            global.client.handleReply.push({
                name: module.exports.config.name,
                stage: "category",
                author: event.senderID,
                messageID: info.messageID,
                categories,
                byCategory,
                PREFIX
            });
        }
    }, mid);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
    const { author, categories, byCategory, stage, cmds, catName, PREFIX } = handleReply;
    if (event.senderID != author) return;

    if (stage === "category") {
        const reply = event.body.trim().toLowerCase();
        if (reply === "all") {
            const allCmds = [];
            for (const cat of categories) allCmds.push(...byCategory[cat]);
            allCmds.sort((a, b) => a.config.name.localeCompare(b.config.name, 'vi'));
            let msg = `TẤT CẢ LỆNH BOT (${allCmds.length}):\n━━━━━━━━━━━━━━━━━━━━━━\n`;
            allCmds.forEach((cmd, i) => {
                msg += `${i + 1}. ${PREFIX}${cmd.config.name} (${cmd.config.commandCategory || "Khác"})\n`;
            });
            msg += "━━━━━━━━━━━━━━━━━━━━━━\n";
            msg += `💡 Reply/phản hồi số để xem chi tiết lệnh, hoặc gõ "${PREFIX}menu" để về menu nhóm.`;

            api.sendMessage(msg, event.threadID, (err, info) => {
                if (!err && info) {
                    global.client.handleReply.push({
                        name: module.exports.config.name,
                        stage: "all",
                        author: event.senderID,
                        messageID: info.messageID,
                        cmds: allCmds,
                        PREFIX
                    });
                }
            }, event.messageID);
            return;
        }

        if (!/^\d+$/.test(reply)) {
            return api.sendMessage("⛔ Vui lòng chỉ nhập số STT nhóm muốn xem hoặc \"all\" để xem toàn bộ lệnh!", event.threadID, event.messageID);
        }
        const idx = parseInt(reply) - 1;
        if (idx < 0 || idx >= categories.length) {
            return api.sendMessage("⛔ Số không hợp lệ, hãy thử lại!", event.threadID, event.messageID);
        }
        const catName = categories[idx];
        let cmds = byCategory[catName];
        cmds = cmds.sort((a, b) => a.config.name.localeCompare(b.config.name, 'vi'));
        let msg = `DANH SÁCH LỆNH NHÓM: ${catName}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        cmds.forEach((cmd, i) => {
            msg += `${i + 1}. ${PREFIX}${cmd.config.name}\n`;
        });
        msg += "━━━━━━━━━━━━━━━━━━━━━━\n";
        msg += `💡 Reply/phản hồi số bất kỳ trong danh sách để xem chi tiết lệnh đó, hoặc gõ "${PREFIX}menu" để về menu tổng.`;

        api.sendMessage(msg, event.threadID, (err, info) => {
            if (!err && info) {
                global.client.handleReply.push({
                    name: module.exports.config.name,
                    stage: "command",
                    author: event.senderID,
                    messageID: info.messageID,
                    cmds,
                    catName,
                    PREFIX
                });
            }
        }, event.messageID);
        return;
    }

    if (stage === "command" || stage === "all") {
        const reply = event.body.trim();
        if (!/^\d+$/.test(reply)) {
            return api.sendMessage("⛔ Vui lòng chỉ nhập số STT lệnh muốn xem!", event.threadID, event.messageID);
        }
        const idx = parseInt(reply) - 1;
        if (!handleReply.cmds || idx < 0 || idx >= handleReply.cmds.length) {
            return api.sendMessage("⛔ Số không hợp lệ, hãy thử lại!", event.threadID, event.messageID);
        }
        const cmd = handleReply.cmds[idx].config;
        let msg = `LỆNH: ${PREFIX}${cmd.name}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `• Quyền: ${TextPr(cmd.hasPermssion)}\n`;
        msg += `• Mô tả: ${cmd.description || "Không có"}\n`;
        msg += `• Cách dùng: ${cmd.usages || "Không rõ"}\n`;
        msg += `• Nhóm: ${cmd.commandCategory || "Khác"}\n`;
        msg += `• Thời gian chờ: ${cmd.cooldowns || 0}s\n`;
        msg += "━━━━━━━━━━━━━━━━━━━━━━\n💡 Reply/phản hồi số khác để xem lệnh khác, hoặc gõ ";
        msg += (stage === "all") ? `"${PREFIX}menu all"` : `"${PREFIX}menu"`;
        msg += " để về menu tổng.";

        api.sendMessage(msg, event.threadID, (err, info) => {
            if (!err && info) {
                global.client.handleReply.push({
                    name: module.exports.config.name,
                    stage: stage,
                    author: event.senderID,
                    messageID: info.messageID,
                    cmds: handleReply.cmds,
                    catName: handleReply.catName,
                    PREFIX
                });
            }
        }, event.messageID);
    }
};
