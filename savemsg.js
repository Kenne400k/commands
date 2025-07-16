const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");
const axios = require("axios");
const FormData = require("form-data");

const DATA_DIRECTORY = path.join(__dirname, "cache", "save_message");
const CACHE_DIRECTORY = path.join(__dirname, "cache");

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const power = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, power)).toFixed(dm)) + ' ' + sizes[power];
}

async function uploadToCatbox(fileUrl) {
    const tempFilePath = path.join(CACHE_DIRECTORY, `catbox_${Date.now()}.tmp`);
    try {
        const response = await axios({ method: 'get', url: fileUrl, responseType: 'stream' });
        const writer = fs.createWriteStream(tempFilePath);
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', fs.createReadStream(tempFilePath));
        const result = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders() });
        fs.unlinkSync(tempFilePath);
        return result.data;
    } catch (error) {
        console.error("Catbox Upload Error:", error.message);
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        return fileUrl;
    }
}

module.exports.config = {
    name: "savemsg",
    version: "3.1.9",
    hasPermssion: 0,
    credits: "MintDaL, Lương Trường Khôi (LunarKrystal), Nguyễn Trương Thiện Phát (Pcoder)",
    description: "Lưu và quản lý lịch sử tin nhắn với quyền hạn chi tiết.",
    commandCategory: "Công cụ",
    usages: "• savemsg check [reply/@tag/uid]\n• savemsg",
    cooldowns: 5,
};

module.exports.onLoad = () => {
    if (!fs.existsSync(DATA_DIRECTORY)) fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
    if (!fs.existsSync(CACHE_DIRECTORY)) fs.mkdirSync(CACHE_DIRECTORY, { recursive: true });
};

module.exports.handleEvent = async ({ api, event }) => {
    if (event.senderID == api.getCurrentUserID()) return;
    try {
        const { threadID, senderID, body, attachments, type } = event;
        if (type !== "message" && type !== "message_reply") return;
        const threadFilePath = path.join(DATA_DIRECTORY, `${threadID}.json`);
        let threadData = fs.existsSync(threadFilePath) ? JSON.parse(fs.readFileSync(threadFilePath, "utf8")) : {};
        if (!threadData[senderID]) threadData[senderID] = [];
        const processedAttachments = attachments && attachments.length > 0 ? await Promise.all(attachments.map(async (attachment) => ({ type: attachment.type, url: await uploadToCatbox(attachment.url) }))) : [];
        threadData[senderID].push({ type: type, message: body, time: moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY"), attachments: processedAttachments });
        if (threadData[senderID].length > 100) threadData[senderID].shift();
        fs.writeFileSync(threadFilePath, JSON.stringify(threadData, null, 4));
    } catch (error) {
        console.error("SaveMsg Event Error:", error);
    }
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
    if (event.senderID !== handleReply.author) return;
    const { threadID, messageID, body } = event;
    const choice = parseInt(body.trim());
    if (isNaN(choice) || choice < 1 || choice > handleReply.allFiles.length) {
        return api.sendMessage("⚠️ Lựa chọn không hợp lệ.", threadID, messageID);
    }
    const fileName = handleReply.allFiles[choice - 1];
    const filePath = path.join(DATA_DIRECTORY, fileName);
    if (!fs.existsSync(filePath)) return api.sendMessage("⚠️ Lỗi: Không tìm thấy file dữ liệu.", threadID, messageID);
    return api.sendMessage({ body: `🗂️ File dữ liệu của nhóm có ID: ${fileName.replace(".json", "")}`, attachment: fs.createReadStream(filePath) }, threadID, messageID);
};

module.exports.run = async ({ api, event, args, Threads, Users }) => {
    const { threadID, messageID, senderID } = event;
    const isBotAdmin = global.config.ADMINBOT.includes(senderID);
    const command = args[0] ? args[0].toLowerCase() : 'default';

    if (command === 'delete' || command === 'del') {
        if (!isBotAdmin) return api.sendMessage("⚠️ Chỉ Quản trị viên bot mới có quyền xóa dữ liệu.", threadID, messageID);
        const threadFilePath = path.join(DATA_DIRECTORY, `${threadID}.json`);
        if (!fs.existsSync(threadFilePath)) return api.sendMessage("❌ Nhóm này chưa có dữ liệu để xóa.", threadID, messageID);
        fs.unlinkSync(threadFilePath);
        return api.sendMessage("✅ Đã xóa thành công dữ liệu tin nhắn của nhóm này.", threadID, messageID);
    }
    
    else if (command === 'check') {
        const commandArgs = args.slice(1);
        let targetUserID;
        if (event.type === "message_reply") {
            targetUserID = event.messageReply.senderID;
        } else {
            const mentions = Object.keys(event.mentions);
            targetUserID = mentions[0] || commandArgs[0];
        }
        if (!targetUserID || !/^\d+$/.test(targetUserID)) {
            return api.sendMessage("⚠️ Vui lòng reply, tag hoặc nhập UID hợp lệ của người cần check.", threadID, messageID);
        }
        const targetThreadID = commandArgs.find(arg => /^\d+$/.test(arg) && arg !== targetUserID) || threadID;
        const currentThreadInfo = await Threads.getData(threadID);
        const isGroupAdmin = (currentThreadInfo?.adminIDs ?? []).some(admin => admin.id === senderID);
        if (!isBotAdmin && !isGroupAdmin) {
             return api.sendMessage("⚠️ Bạn không có quyền sử dụng chức năng này.", threadID, messageID);
        }
        if (isGroupAdmin && !isBotAdmin && targetThreadID !== threadID) {
            return api.sendMessage("⚠️ Là QTV, bạn chỉ có quyền kiểm tra dữ liệu trong nhóm của mình.", threadID, messageID);
        }
        const targetDataPath = path.join(DATA_DIRECTORY, `${targetThreadID}.json`);
        if (!fs.existsSync(targetDataPath)) return api.sendMessage(`❌ Không tìm thấy dữ liệu cho nhóm có ID: ${targetThreadID}.`, threadID, messageID);
        const threadMessages = JSON.parse(fs.readFileSync(targetDataPath, "utf8"));
        const userMessages = threadMessages[targetUserID];
        if (!userMessages || userMessages.length === 0) return api.sendMessage(`❌ Không tìm thấy dữ liệu tin nhắn của người dùng này trong nhóm.`, threadID, messageID);
        const userName = await Users.getNameUser(targetUserID);
        let fileContent = `📜 Lịch sử 15 tin nhắn gần nhất của ${userName} (ID: ${targetUserID})\n────────────────────\n\n`;
        const recentMessages = userMessages.slice(-15);
        for (const record of recentMessages) {
            fileContent += `[${record.time}]\n`;
            if (record.message) fileContent += `💬 Tin nhắn: ${record.message}\n`;
            if (record.attachments && record.attachments.length > 0) fileContent += `📎 Tệp đính kèm:\n${record.attachments.map(att => ` - ${att.url}`).join("\n")}\n`;
            fileContent += "────────────────────\n";
        }
        const tempFilePath = path.join(CACHE_DIRECTORY, `history_${Date.now()}.txt`);
        fs.writeFileSync(tempFilePath, fileContent);
        return api.sendMessage({ body: `📜 Lịch sử tin nhắn của ${userName} được đính kèm trong file.`, attachment: fs.createReadStream(tempFilePath) }, threadID, () => fs.unlinkSync(tempFilePath), messageID);
    }

    else { // DEFAULT COMMAND
        const currentThreadInfo = await Threads.getData(threadID);
        const isGroupAdmin = (currentThreadInfo?.adminIDs ?? []).some(admin => admin.id === senderID);

        // --- ADMIN VIEW ---
        if (isBotAdmin) {
            const allDataFiles = fs.readdirSync(DATA_DIRECTORY).filter(file => file.endsWith('.json'));
            if (allDataFiles.length === 0) return api.sendMessage("✅ Hiện chưa có dữ liệu của nhóm nào được lưu.", threadID, messageID);
            let totalSize = 0;
            let groupList = [];
            for (const fileName of allDataFiles) {
                const filePath = path.join(DATA_DIRECTORY, fileName);
                const stats = fs.statSync(filePath);
                totalSize += stats.size;
                const groupID = fileName.replace(".json", "");
                try {
                    const threadInfo = await Threads.getData(groupID);
                    const threadName = threadInfo?.threadInfo?.threadName || `Nhóm ID: ${groupID}`;
                    groupList.push({ name: threadName, size: formatBytes(stats.size) });
                } catch (error) {
                    groupList.push({ name: `Nhóm đã rời (ID: ${groupID})`, size: formatBytes(stats.size) });
                }
            }
            let messageBody = "📖 HƯỚNG DẪN & THỐNG KÊ (ADMIN)\n────────────────────\n";
            messageBody += "• `savemsg check [reply/@tag/uid] [tid]`: Xem tin nhắn.\n";
            messageBody += "• `savemsg delete`: Xóa data nhóm.\n";
            messageBody += "• `savemsg`: Liệt kê các nhóm & tải file.\n────────────────────\n\n";
            messageBody += "📁 DANH SÁCH NHÓM ĐÃ LƯU DỮ LIỆU\n\n";
            groupList.forEach((group, index) => { messageBody += `${index + 1}. ${group.name}\n`; });
            messageBody += "\n💬 Reply tin nhắn này theo STT để tải file data JSON.\nℹ️ Chi tiết có trong file đính kèm.";
            let fileContent = `📁 DANH SÁCH CHI TIẾT\n\n`;
            groupList.forEach((group, index) => { fileContent += `${index + 1}. ${group.name} - 💾 ${group.size}\n`; });
            fileContent += `\n────────────────────\n🗂️ Tổng dung lượng: ${formatBytes(totalSize)}`;
            const tempFilePath = path.join(CACHE_DIRECTORY, `admin_details_${Date.now()}.txt`);
            fs.writeFileSync(tempFilePath, fileContent);
            return api.sendMessage({ body: messageBody, attachment: fs.createReadStream(tempFilePath) }, threadID, (error, info) => {
                fs.unlinkSync(tempFilePath);
                if (error) return console.error(error);
                global.client.handleReply.push({ name: this.config.name, messageID: info.messageID, author: senderID, allFiles: allDataFiles });
            });
        }
        // --- GROUP ADMIN (QTV) VIEW ---
        else if (isGroupAdmin) {
            const threadFilePath = path.join(DATA_DIRECTORY, `${threadID}.json`);
            if (!fs.existsSync(threadFilePath)) return api.sendMessage("ℹ️ Nhóm này hiện chưa có dữ liệu nào được bot lưu lại.", threadID, messageID);
            const stats = fs.statSync(threadFilePath);
            // SỬA LỖI: Thêm optional chaining và giá trị mặc định
            const threadName = currentThreadInfo?.threadInfo?.threadName ?? "Nhóm này";
            let fileContent = "👑 HƯỚNG DẪN (QUẢN TRỊ VIÊN)\n────────────────────\n";
            fileContent += "Là QTV, bạn có các quyền sau:\n\n";
            fileContent += "• `savemsg check [reply/@tag/uid]`\n   - Xem lịch sử tin nhắn của thành viên trong nhóm này.\n\n";
            fileContent += "• `savemsg`\n   - Xem hướng dẫn này và thống kê dữ liệu của nhóm.\n";
            fileContent += "────────────────────\n";
            fileContent += `📊 THỐNG KÊ NHÓM\n- Tên nhóm: ${threadName}\n- Dung lượng đã lưu: ${formatBytes(stats.size)}`;
            const tempFilePath = path.join(CACHE_DIRECTORY, `qtv_guide_${Date.now()}.txt`);
            fs.writeFileSync(tempFilePath, fileContent);
            return api.sendMessage({ body: `👑 Hướng dẫn và thông tin dành cho QTV được đính kèm.`, attachment: fs.createReadStream(tempFilePath) }, threadID, () => fs.unlinkSync(tempFilePath), messageID);
        }
        // --- REGULAR MEMBER VIEW ---
        else {
            const threadFilePath = path.join(DATA_DIRECTORY, `${threadID}.json`);
            if (!fs.existsSync(threadFilePath)) return api.sendMessage("ℹ️ Nhóm này hiện chưa có dữ liệu nào được bot lưu lại.", threadID, messageID);
            const stats = fs.statSync(threadFilePath);
            // SỬA LỖI: Thêm optional chaining và giá trị mặc định
            const threadName = currentThreadInfo?.threadInfo?.threadName ?? "Nhóm này";
            let fileContent = `📊 THỐNG KÊ DỮ LIỆU NHÓM\n────────────────────\n- Tên nhóm: ${threadName}\n- Dung lượng đã lưu: ${formatBytes(stats.size)}`;
            const tempFilePath = path.join(CACHE_DIRECTORY, `groupinfo_${Date.now()}.txt`);
            fs.writeFileSync(tempFilePath, fileContent);
            return api.sendMessage({ body: `📊 Thông tin dữ liệu của nhóm bạn được đính kèm trong file.`, attachment: fs.createReadStream(tempFilePath) }, threadID, () => fs.unlinkSync(tempFilePath), messageID);
        }
    }
};
