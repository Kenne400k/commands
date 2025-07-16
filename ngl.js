const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');
const { createCanvas, registerFont } = require('canvas');
const MAX_RESTART_ATTEMPTS = 10;
const RESTART_COUNT_FILE = path.join(__dirname, 'cache', 'ngl_restart_attempts.json');
async function getRestartAttemptCount() {
    try {
        if (await fs.pathExists(RESTART_COUNT_FILE)) {
            const data = await fs.readJson(RESTART_COUNT_FILE);
            return data.attempts || 0;
        }
    } catch (e) {
        console.error("[PCODER] Lỗi khi đọc số lần khởi động lại (có thể file bị lỗi hoặc không có quyền đọc):", e.message);
    }
    return 0;
}
async function incrementRestartAttemptCount() {
    let attempts = await getRestartAttemptCount();
    attempts++;
    try {
        await fs.ensureDir(path.dirname(RESTART_COUNT_FILE)); 
        await fs.writeJson(RESTART_COUNT_FILE, { attempts });
    } catch (e) {
        console.error("[PCODER] Lỗi khi ghi số lần khởi động lại (kiểm tra quyền ghi):", e.message);
    }
    return attempts;
}
async function resetRestartAttemptCount() {
    try {
        await fs.ensureDir(path.dirname(RESTART_COUNT_FILE));
        await fs.writeJson(RESTART_COUNT_FILE, { attempts: 0 });
        console.log("[PCODER] Đã reset bộ đếm số lần khởi động lại do lỗi credit.");
    } catch (e) {
        console.error("[PCODER] Lỗi khi reset số lần khởi động lại:", e.message);
    }
}
module.exports.config = {
    name: "ngl",
    version: "2.2.2",
    hasPermssion: 0,
    credits: "Nguyễn Trương Thiện Phát (pcoder)", 
    description:
        "spam NGL",
    commandCategory: "tools",
    usages: "[username/URL] [số lượng tin nhắn] [nội dung tin nhắn] [yes/no] | stop",
    cooldowns: 5,
};
const DEFAULT_FONT = 'Arial';
const CACHE_DIR_NGL = path.join(__dirname, 'cache', 'ngl_spam');
if (!fs.existsSync(CACHE_DIR_NGL)) {
    try {
        fs.mkdirSync(CACHE_DIR_NGL, { recursive: true });
    } catch (e) {
        console.error("[NGL] Không thể tạo thư mục cache cho NGL:", e.message);
    }
}
function roundRectCanvas(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') { stroke = true; }
    if (typeof radius === 'undefined') { radius = 5; }
    if (typeof radius === 'number') { radius = { tl: radius, tr: radius, br: radius, bl: radius }; }
    else {
        const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (const side in defaultRadius) { radius[side] = radius[side] || defaultRadius[side]; }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) { ctx.fill(); }
    if (stroke) { ctx.stroke(); }
}
function wrapTextCanvas(context, text, x, y, maxWidth, lineHeight, font, color) {
    context.font = font;
    context.fillStyle = color;
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let metrics;
    for (let n = 0; n < words.length; n++) {
        testLine = line + words[n] + ' ';
        metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
    return y + lineHeight;
}
async function createNglStatusCanvas(statusType, titleText, detailsArray = []) {
    const canvasWidth = 900;
    let canvasHeight = 200 + (detailsArray.length * 35);
    canvasHeight = Math.max(canvasHeight, 300);
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    const colors = {
        background: '#2C2F33', card: '#23272A', textPrimary: '#FFFFFF', textSecondary: '#B9BBBE',
        accentGreen: '#43B581', accentRed: '#F04747', accentYellow: '#FAA61A', accentBlue: '#7289DA', shadow: 'rgba(0,0,0,0.3)'
    };
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    const cardPadding = 30, cardX = cardPadding, cardY = cardPadding, cardWidth = canvasWidth - (cardPadding * 2), cardHeight = canvasHeight - (cardPadding * 2);
    ctx.fillStyle = colors.card;
    ctx.shadowColor = colors.shadow; ctx.shadowBlur = 10; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4;
    roundRectCanvas(ctx, cardX, cardY, cardWidth, cardHeight, 15, true, false);
    ctx.shadowColor = 'transparent';
    let iconColor = colors.accentBlue;
    const iconOriginalX = cardX + 30, iconYPos = cardY + 55;
    let titleXOffset = 0;
    switch (statusType.toUpperCase()) {
        case 'STOP_CMD': case 'STOP': iconColor = colors.accentRed; ctx.font = `bold 40px "${DEFAULT_FONT}"`; ctx.fillStyle = iconColor; ctx.fillText("🛑", iconOriginalX, iconYPos); titleXOffset = 60; break;
        case 'ERROR': case 'NO_TASK': iconColor = colors.accentRed; ctx.font = `bold 40px "${DEFAULT_FONT}"`; ctx.fillStyle = iconColor; ctx.fillText("⚠️", iconOriginalX, iconYPos); titleXOffset = 60; break;
        case 'START': iconColor = colors.accentYellow; titleXOffset = 5; break;
        case 'PROGRESS': iconColor = colors.accentBlue; titleXOffset = 5; break;
        case 'COMPLETE': iconColor = colors.accentGreen; titleXOffset = 5; break;
        default: titleXOffset = 5; break;
    }
    const titleX = iconOriginalX + titleXOffset, titleYVal = cardY + 60;
    ctx.font = `bold 28px "${DEFAULT_FONT}"`; ctx.fillStyle = colors.textPrimary; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(titleText.toUpperCase(), titleX, titleYVal);
    const lineY = titleYVal + 30;
    ctx.strokeStyle = colors.textSecondary; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cardX + 30, lineY); ctx.lineTo(cardX + cardWidth - 30, lineY); ctx.stroke();
    let currentY = lineY + 30;
    const detailX = cardX + 40, lineHeight = 30, maxTextWidth = cardWidth - 80;
    detailsArray.forEach(detail => {
        if (currentY < cardY + cardHeight - 20) {
            let detailText = detail.text, detailColor = detail.color || colors.textSecondary;
            if (detail.text.includes("Thành công:")) { detailColor = colors.accentGreen; } else if (detail.text.includes("Thất bại:")) { detailColor = colors.accentRed; }
            currentY = wrapTextCanvas(ctx, detailText, detailX, currentY, maxTextWidth, lineHeight, `18px "${DEFAULT_FONT}"`, detailColor);
        }
    });
    const creditName = Buffer.from("Tmd1eeG7hW4gVHLGsMahbmcgVGhp4buHbiBQaMOhdCAocGNvZGVyKQ==", 'base64').toString('utf8');
    const footerText = `NGL Spammer Bot - by ${creditName}`;
    ctx.font = `italic 14px "${DEFAULT_FONT}"`; ctx.fillStyle = colors.textSecondary; ctx.textAlign = 'center';
    ctx.fillText(footerText, canvasWidth / 2, canvasHeight - cardPadding - 10);
    const imagePath = path.join(CACHE_DIR_NGL, `ngl_status_${Date.now()}.png`);
    return new Promise((resolve, reject) => {
        const out = fs.createWriteStream(imagePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        out.on('finish', () => resolve(imagePath));
        out.on('error', (err) => { console.error("[NGL_CANVAS] Lỗi khi ghi stream PNG:", err); reject(err); });
        stream.on('error', (err) => { console.error("[NGL_CANVAS] Lỗi trong stream PNG:", err); reject(err); });
    });
}

const userAgentsPath = path.join(__dirname, '../user-agents.js');
let userAgents = [];
(async function initUserAgents() {
    try {
        if (!await fs.pathExists(userAgentsPath)) {
            console.log("[NGL] Đang tải danh sách user-agents mới...");
            const response = await axios.get('https://raw.githubusercontent.com/Kenne400k/commands/refs/heads/main/user.js');
            await fs.writeFile(userAgentsPath, response.data); userAgents = require("../user-agents");
        } else {
            userAgents = require("../user-agents");
            if (!Array.isArray(userAgents) || userAgents.length === 0) {
                console.warn("[NGL] File user-agents.js không hợp lệ. Tải lại...");
                const response = await axios.get('https://raw.githubusercontent.com/Kenne400k/commands/refs/heads/main/user.js');
                await fs.writeFile(userAgentsPath, response.data); userAgents = require("../user-agents");
            }
        }
    } catch (error) {
        console.error("[NGL] Lỗi khởi tạo/tải user-agents:", error.message, ". Sử dụng danh sách mặc định.");
        userAgents = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'];
    }
})();

const runningTasks = new Map();
const uaMap = new Map();
const MAX_CONCURRENT = 5;
const UA_COOLDOWN = 10000;

function randomString(length = 10, chars = "abcdefghijklmnopqrstuvwxyz0123456789") {
    let result = ""; for (let i = 0; i < length; i++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); } return result;
}
function getRandomEmoji() {
    const emojis = [" 😊"," 😎"," 😍"," 😉"," 😁"," 😄"," 😃"," 🙂"," 😆"," 😅"," 🤣"," 😂"," 😋"," 😛"," 😜"," 🤪"," 🤩"," 🥰"," 😇"," 🙃"," 🥹"," 😌"," 🤗"," 😏"," 🤭"," 🫢"," 🫠"," 🤫"," 😭"," 😢"," 😥"," 😓"," 😞"," 😔"," 🙁"," ☹️"," 😠"," 😡"," 🤬"," 😤"," 😖"," 😫"," 😩"," 🥺"," 😱"," 😨"," 😰"," 😵"," 🤯"," 😳"," 😬"," 🫣"," 🥴"," 🤢"," 🤮"," 😷"," 🤒"," 🤕"," 🤧"," 🥶"," 🥵"," 😈"," 👿"," 💀"," 👻"," 👽"," 😺"," 😸"," 😹"," 😻"," 😼"," 😽"," 🙀"," 😿"," 😾"," 🤡"," ❤️"," 🧡"," 💛"," 💚"," 💙"," 💜"," 🤎"," 🖤"," 🤍"," 💓"," 💗"," 💖"," 💘"," 💝"," 💞"," 💕",];
    return emojis[Math.floor(Math.random() * emojis.length)];
}
function convertToUsername(inputStr) {
    inputStr = inputStr.trim();
    if (inputStr.startsWith("https://ngl.link/")) {
        try { const url = new URL(inputStr); if (url.hostname !== "ngl.link") return null; return url.pathname.replace("/", "") || null; } catch (error) { return null; }
    } return inputStr || null;
}
async function checkUserExists(username) {
    try {
        const response = await axios.get(`https://ngl.link/${username}`, { headers: { "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)], Accept: "text/html" }, timeout: 15000 });
        return !response.data.includes("Could not find user");
    } catch (error) { return false; }
}
function getRandomizedContent(baseContent, enableEmoji) { let content = baseContent; if (enableEmoji) content += getRandomEmoji(); return content; }

async function sendSingleMessage(username, content, deviceId, mixpanelStr) {
    let randomUserAgent; let now = Date.now(); let attempts = 0;
    do {
        randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        const lastUsed = uaMap.get(randomUserAgent) || 0;
        if (now - lastUsed > UA_COOLDOWN || attempts > 10) { uaMap.set(randomUserAgent, now); break; } attempts++;
    } while (attempts < 20);
    const languages = ["vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5", "en-US,en;q=0.9", "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"];
    const headers = {
        Accept: "*/*", "Accept-Encoding": "gzip, deflate, br, zstd", "Accept-Language": languages[Math.floor(Math.random() * languages.length)],
        Connection: Math.random() > 0.2 ? "keep-alive" : "close", "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie: `_ga=GA1.1.${Math.floor(Math.random()*9e9)+1e9}.${Math.floor(Math.random()*9e9)+1e9}; mp_${randomString(32)}_mixpanel=${mixpanelStr}`,
        Host: "ngl.link", Origin: "https://ngl.link", Referer: `https://ngl.link/${username}`,
        "sec-ch-ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"', "sec-ch-ua-mobile": Math.random() > 0.7 ? "?1" : "?0",
        "sec-ch-ua-platform": ['"Windows"', '"macOS"', '"Android"', '"iOS"', '"Linux"'][Math.floor(Math.random() * 5)],
        "Sec-Fetch-Dest": "empty", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Site": "same-origin", "User-Agent": randomUserAgent,
        "X-Requested-With": "XMLHttpRequest", "Cache-Control": Math.random() > 0.5 ? "no-cache" : "max-age=0", Pragma: Math.random() > 0.5 ? "no-cache" : "", Priority: ["high", "low", "auto"][Math.floor(Math.random() * 3)],
    };
    const data = { username, question: content, deviceId, gameSlug: "", referrer: "", lang: Math.random() > 0.5 ? "en" : "vi" };
    const formData = new URLSearchParams(data).toString();
    try {
        const response = await axios.post("https://ngl.link/api/submit", formData, { headers, timeout: 15000 });
        return { success: true, status: response.status };
    } catch (error) {
        if (error.response && error.response.status === 429) uaMap.set(randomUserAgent, now + 30000);
        return { success: false, error: error.message, status: error.response ? error.response.status : null };
    }
}

async function sendNglMessagesWithWorkers(api, threadID, username, numMessages, baseQuestion, enableEmoji, taskState) {
    const deviceId = `${randomString(8)}-${randomString(4)}-${randomString(4)}-${randomString(4)}-${randomString(12)}`;
    const mixpanelData = { distinct_id: `$device:${deviceId}`, device_id: deviceId, initial_referrer: "$direct", initial_referring_domain: "$direct", mps: {}, mpso: { initial_referrer: "$direct", initial_referring_domain: "$direct" }, mpus: {}, };
    const mixpanelStr = encodeURIComponent(JSON.stringify(mixpanelData));
    const messageQueue = []; let successCount = 0; let errorCount = 0; const startTime = Date.now();
    try {
        const startDetails = [ { text: `Người nhận: ${username}` }, { text: `Số lượng: ${numMessages} tin` }, { text: `Nội dung gốc: ${baseQuestion.substring(0, 60)}${baseQuestion.length > 60 ? "..." : ""}` }, { text: `Thêm emoji ngẫu nhiên: ${enableEmoji ? 'Có' : 'Không'}` }];
        const startImagePath = await createNglStatusCanvas('START', 'BẮT ĐẦU SPAM NGL', startDetails);
        api.sendMessage({ attachment: fs.createReadStream(startImagePath) }, threadID, () => fs.unlinkSync(startImagePath));
    } catch (e) { console.error("[NGL] Lỗi tạo canvas bắt đầu:", e); api.sendMessage(`⏳ Bắt đầu gửi ${numMessages} tin nhắn đến ${username}... (Lỗi tạo ảnh)`, threadID); }
    for (let i = 0; i < numMessages; i++) { messageQueue.push(getRandomizedContent(baseQuestion, enableEmoji)); }
    async function worker() {
        while (messageQueue.length > 0 && !taskState.shouldStop) {
            const content = messageQueue.shift(); await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
            const result = await sendSingleMessage(username, content, deviceId, mixpanelStr);
            if (result.success) successCount++; else { errorCount++; if (result.status === 429) await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000)); else if (!result.success) await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000)); }
        }
    }
    const progressInterval = setInterval(async () => {
        if (taskState.shouldStop) { clearInterval(progressInterval); return; }
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        if (elapsedSeconds > 0 && elapsedSeconds % 60 === 0) {
            const progressDetails = [ { text: `Người nhận: ${username}` }, { text: `Đã gửi: ${successCount}/${numMessages}` }, { text: `Thất bại: ${errorCount}` }, { text: `Thời gian chạy: ${elapsedSeconds} giây` } ];
            try { const progressImagePath = await createNglStatusCanvas('PROGRESS', 'TIẾN ĐỘ SPAM NGL', progressDetails); api.sendMessage({ attachment: fs.createReadStream(progressImagePath)}, threadID, () => fs.unlinkSync(progressImagePath)); }
            catch (e) { console.error("[NGL] Lỗi tạo canvas tiến độ:", e); api.sendMessage(`⌛ Tiến độ: ${successCount}/${numMessages} tin nhắn đã gửi (${errorCount} thất bại)`, threadID); }
        }
    }, 60000);
    const workerPromises = Array.from({ length: Math.min(MAX_CONCURRENT, numMessages) }, () => worker());
    await Promise.all(workerPromises); clearInterval(progressInterval);
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    if (taskState.shouldStop) {
        const stopDetails = [ { text: `Người nhận: ${username}` }, { text: `Nội dung gốc: ${baseQuestion.substring(0, 60)}${baseQuestion.length > 60 ? "..." : ""}` }, { text: `Thành công: ${successCount}`, color: '#43B581' }, { text: `Thất bại: ${errorCount}`, color: '#F04747' } ];
        try { const stopImagePath = await createNglStatusCanvas('STOP', 'ĐÃ DỪNG SPAM NGL', stopDetails); api.sendMessage({ attachment: fs.createReadStream(stopImagePath) }, threadID, () => fs.unlinkSync(stopImagePath)); }
        catch (e) { console.error("[NGL] Lỗi tạo canvas dừng:", e); api.sendMessage(`🛑 Đã dừng gửi.\nThành công: ${successCount}, Thất bại: ${errorCount}`, threadID); }
    } else {
        const completeDetails = [ { text: `Người nhận: ${username}` }, { text: `Nội dung gốc: ${baseQuestion.substring(0, 60)}${baseQuestion.length > 60 ? "..." : ""}` }, { text: `Thành công: ${successCount}`, color: '#43B581' }, { text: `Thất bại: ${errorCount}`, color: '#F04747' }, { text: `Tổng thời gian: ${totalTime}s` } ];
        try { const completeImagePath = await createNglStatusCanvas('COMPLETE', 'HOÀN THÀNH SPAM NGL', completeDetails); api.sendMessage({ attachment: fs.createReadStream(completeImagePath) }, threadID, () => fs.unlinkSync(completeImagePath)); }
        catch (e) { console.error("[NGL] Lỗi tạo canvas hoàn thành:", e); api.sendMessage(`✅ Hoàn thành.\nThành công: ${successCount}, Thất bại: ${errorCount}.\nTổng thời gian: ${totalTime}s`, threadID); }
    }
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const ec_b64 = "Tmd1eeG7hW4gVHLGsMahbmcgVGhp4buHbiBQaMOhdCAocGNvZGVyKQ=="; 
    const EXPECTED_CREDITS = Buffer.from(ec_b64, 'base64').toString('utf8');
    if (module.exports.config.credits !== EXPECTED_CREDITS) {
        for (let i = 0; i < 5; i++) {
            console.warn(`[PCODER] CẢNH BÁO NGHIÊM TRỌNG: CREDIT ĐÃ BỊ THAY ĐỔI! AI CHO PHÉP THAY ĐỔI CREDIT? Credit gốc phải là: "${EXPECTED_CREDITS}". Credit hiện tại trong file code: "${module.exports.config.credits}"`);
        }
        api.sendMessage(`[PCODER] CẢNH BÁO KHẨN CẤP:\n\nThông tin credits của module "${module.exports.config.name}" đã bị thay đổi trái phép.\n- Credit gốc: "${EXPECTED_CREDITS}"\n- Credit hiện tại: "${module.exports.config.credits}"\n\nĐây là hành vi vi phạm điều khoản sử dụng. Hệ thống sẽ thực hiện các biện pháp cần thiết. Vui lòng khôi phục credit gốc hoặc liên hệ người phát triển ("${EXPECTED_CREDITS}").`, threadID);
        
        const currentAttempts = await incrementRestartAttemptCount();

        if (currentAttempts >= MAX_RESTART_ATTEMPTS) {
            console.error(`[PCODER] FATAL: Đã đạt tối đa (${MAX_RESTART_ATTEMPTS}) lần khởi động lại do thay đổi credits cho module "${module.exports.config.name}". TẮT BOT VĨNH VIỄN ĐỂ BẢO VỆ TÍNH TOÀN VẸN.`);
            api.sendMessage(`[PCODER] LỖI HỆ THỐNG NGHIÊM TRỌNG:\n\nModule "${module.exports.config.name}" đã bị thay đổi credits quá nhiều lần. Để đảm bảo an toàn và tuân thủ, bot sẽ tự tắt. Vui lòng liên hệ người phát triển gốc ("${EXPECTED_CREDITS}") để được hỗ trợ nếu bạn không phải là người chỉnh sửa.`, threadID);
            await resetRestartAttemptCount(); 
            setTimeout(() => process.exit(0), 5000); 
            return; 
        } else {
            console.log(`[PCODER] Đang cố gắng khởi động lại bot do phát hiện credit bị thay đổi ở module "${module.exports.config.name}"... (Lần ${currentAttempts}/${MAX_RESTART_ATTEMPTS})`);
            api.sendMessage(`[PCODER] Module "${module.exports.config.name}": Phát hiện credit không hợp lệ. Đang thử khởi động lại bot... (Lần thử: ${currentAttempts}/${MAX_RESTART_ATTEMPTS})`, threadID);
            setTimeout(() => process.exit(1), 5000); 
            return; 
        }
    } else {
        const attemptsMade = await getRestartAttemptCount();
        if (attemptsMade > 0) {
            console.log(`[PCODER] Credit của module "${module.exports.config.name}" đã chính xác ("${EXPECTED_CREDITS}"). Reset bộ đếm lỗi thay đổi credit.`);
            await resetRestartAttemptCount();
        }
    }

    if (args[0]?.toLowerCase() === "stop") {
        if (runningTasks.has(threadID)) {
            runningTasks.get(threadID).shouldStop = true;
            try { const stopCmdImagePath = await createNglStatusCanvas('STOP_CMD', 'LỆNH DỪNG NGL', [{text:"Đã nhận lệnh dừng. Đang xử lý dừng các tiến trình..."}]); return api.sendMessage({ attachment: fs.createReadStream(stopCmdImagePath) }, threadID, () => fs.unlinkSync(stopCmdImagePath), messageID); }
            catch (e) { console.error("[NGL] Lỗi tạo canvas lệnh dừng:", e); return api.sendMessage("🛑 Đã gửi lệnh dừng quá trình gửi tin nhắn NGL. (Lỗi tạo ảnh)", threadID, messageID); }
        } else {
            try { const noTaskImagePath = await createNglStatusCanvas('NO_TASK', 'KHÔNG CÓ TÁC VỤ NGL', [{text:"Hiện không có tiến trình spam NGL nào đang chạy trong nhóm này."}]); return api.sendMessage({ attachment: fs.createReadStream(noTaskImagePath) }, threadID, () => fs.unlinkSync(noTaskImagePath), messageID); }
            catch (e) { console.error("[NGL] Lỗi tạo canvas không có tác vụ:", e); return api.sendMessage("⚠️ Không có tiến trình nào đang chạy để dừng lại. (Lỗi tạo ảnh)", threadID, messageID); }
        }
    }

    if (args.length < 3) { return api.sendMessage(`❌ Sai cú pháp!\nSử dụng: ${module.exports.config.usages}`, threadID, messageID); }
    const userInput = args[0]; const numMessages = parseInt(args[1]); let enableEmoji = false; let question;
    const lastArg = args[args.length - 1]?.toLowerCase();
    if (lastArg === "yes" || lastArg === "no") { enableEmoji = lastArg === "yes"; question = args.slice(2, args.length - 1).join(" ") || "Gửi từ NGL Bot"; }
    else { question = args.slice(2).join(" ") || "Gửi từ NGL Bot"; }
    if (isNaN(numMessages) || numMessages < 1 || numMessages > 1000) { return api.sendMessage("⚠️ Số lượng tin nhắn phải là một số từ 1 đến 1000.", threadID, messageID); }
    let username = convertToUsername(userInput);
    if (!username) { return api.sendMessage("⚠️ Định dạng username hoặc URL NGL không hợp lệ.", threadID, messageID); }
    try { const userExists = await checkUserExists(username); if (!userExists) return api.sendMessage(`⚠️ Người dùng NGL '${username}' không tồn tại.`, threadID, messageID); }
    catch (error) { return api.sendMessage("❌ Lỗi khi kiểm tra username NGL: " + error.message, threadID, messageID); }
    if (runningTasks.has(threadID)) {
        try { const alreadyRunningPath = await createNglStatusCanvas('ERROR', 'TÁC VỤ NGL ĐANG CHẠY', [{text:`Một tiến trình spam NGL khác đang chạy trong nhóm này.\nVui lòng đợi hoàn thành hoặc dùng lệnh "${module.exports.config.name} stop".`}]); return api.sendMessage({ attachment: fs.createReadStream(alreadyRunningPath) }, threadID, () => fs.unlinkSync(alreadyRunningPath), messageID); }
        catch (e) { console.error("[NGL] Lỗi tạo canvas tác vụ đang chạy:", e); return api.sendMessage("⚠️ Một tiến trình spam NGL khác đang chạy trong nhóm này. Vui lòng đợi hoặc dùng lệnh stop. (Lỗi tạo ảnh)", threadID, messageID); }
    }
    const taskState = { shouldStop: false }; runningTasks.set(threadID, taskState);
    try { await sendNglMessagesWithWorkers(api, threadID, username, numMessages, question, enableEmoji, taskState); }
    catch (error) {
        console.error("[NGL] Lỗi nghiêm trọng trong quá trình gửi:", error);
        try { const errorPath = await createNglStatusCanvas('ERROR', 'LỖI SPAM NGL', [{text:`Đã xảy ra lỗi: ${error.message}`}]); api.sendMessage({ attachment: fs.createReadStream(errorPath) }, threadID, () => fs.unlinkSync(errorPath)); }
        catch (e) { api.sendMessage(`❌ Lỗi khi gửi tin nhắn NGL: ${error.message} (Lỗi tạo ảnh báo lỗi)`, threadID); }
    } finally { if (runningTasks.has(threadID)) { runningTasks.delete(threadID); } }
};

module.exports.handleReply = async function ({ api, event, handleReply }) { return; };
