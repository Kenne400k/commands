const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// --- CẤU HÌNH GAME ---
const GAME_DURATION = 20; // Thời gian chơi (giây)
const COOLDOWN_SECONDS = 10; // Thời gian chờ giữa các lần chơi
const WRONG_ATTEMPT_LIMIT = 3; // Số lần sai tối đa
const PENALTY_COOLDOWN_MINUTES = 1; // Thời gian phạt khi sai quá số lần

const GITHUB_SENTENCES_URL = 'https://raw.githubusercontent.com/Kenne400k/commands/refs/heads/main/game/gochudata.json';

let sentences = [];
const playerAttempts = new Map();

// --- HÀM HỖ TRỢ TỰ ĐỘNG XUỐNG DÒNG ---
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    const startY = y - (lines.length - 1) * lineHeight / 2;

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i].trim(), x, startY + i * lineHeight);
    }
}
// --- HÀM TẠO ẢNH CANVAS ---
async function createTypingImage(text) {
    const width = 1200, height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#232526');
    gradient.addColorStop(1, '#414345');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const colors = ['#00f6ff', '#ff00f6', '#f6ff00', '#32ff7e', '#ff9f1a'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const fontSize = 60; 
    ctx.font = `bold ${fontSize}px "Signika-SemiBold"`;
    ctx.fillStyle = '#FFFFFF';
    
    ctx.shadowColor = randomColor;
    ctx.shadowBlur = 20;
    
    const maxWidth = width - 150;
    const lineHeight = fontSize * 1.2;
    wrapText(ctx, text, width / 2, height / 2, maxWidth, lineHeight);

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '30px "Signika-SemiBold"';
    ctx.fillText(`Gõ lại câu trên trong ${GAME_DURATION} giây!`, width / 2, height - 60);

    return canvas.toBuffer('image/png');
}

module.exports = {
    config: {
        name: "gochu",
        version: "1.0.0",
        hasPermission: 0,
        credits: "Pcoder",
        description: "Luyện kỹ năng gõ phím với giao diện mới!",
        commandCategory: "Game",
        usages: "",
        cooldowns: COOLDOWN_SECONDS,
    },

    onLoad: async function() {
        const cacheDir = path.join(__dirname, '../cache');
        await fs.ensureDir(cacheDir);

        const fontUrl = 'https://github.com/Kenne400k/font/raw/refs/heads/main/Signika-SemiBold.ttf';
        const fontPath = path.join(cacheDir, 'Signika-SemiBold.ttf');
        if (!fs.existsSync(fontPath)) {
            try {
                const response = await axios.get(fontUrl, { responseType: 'stream' });
                response.data.pipe(fs.createWriteStream(fontPath));
                console.log("Tải font Signika-SemiBold thành công.");
            } catch (error) { console.error("Lỗi khi tải font:", error.message); }
        }
        
        try {
            registerFont(fontPath, { family: "Signika-SemiBold" });
        } catch(e) { console.error("Lỗi đăng ký font:", e); }

        try {
            console.log("Đang tải dữ liệu câu hỏi từ GitHub...");
            const response = await axios.get(GITHUB_SENTENCES_URL);
            if (Array.isArray(response.data)) {
                sentences = response.data;
                console.log(`Tải thành công ${sentences.length} câu hỏi cho game Gõ Chữ Nhanh.`);
            } else {
                console.error("Lỗi: Dữ liệu từ GitHub không phải là một mảng (array).");
            }
        } catch (error) {
            console.error("Không thể tải dữ liệu câu hỏi từ GitHub:", error.message);
        }
    },

    run: async function ({ api, event }) {
        const { threadID, senderID, messageID } = event;
        
        if (sentences.length === 0) {
            return api.sendMessage("Kho dữ liệu câu hỏi đang trống hoặc không thể tải được. Vui lòng thử lại sau.", threadID, messageID);
        }
        
        const penaltyData = playerAttempts.get(senderID);
        if (penaltyData && penaltyData.penaltyUntil && penaltyData.penaltyUntil > Date.now()) {
            const remainingTime = Math.ceil((penaltyData.penaltyUntil - Date.now()) / 1000);
            return api.sendMessage(`❌ Bạn đã gõ sai quá nhiều lần. Vui lòng thử lại sau ${remainingTime} giây.`, threadID, event.messageID);
        }

        const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];

        try {
            const imageBuffer = await createTypingImage(randomSentence);
            const imagePath = path.join(__dirname, `../../cache/typing_game_${threadID}.png`);
            await fs.writeFile(imagePath, imageBuffer);

            api.sendMessage({
                body: "🔥 GÕ CHỮ NHANH 🔥\n\nReply (phản hồi) tin nhắn này với nội dung trên ảnh để chơi!",
                attachment: fs.createReadStream(imagePath)
            }, threadID, (err, info) => {
                if (err) return console.error(err);
                
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    correctAnswer: randomSentence,
                    startTime: Date.now()
                });
                
                fs.unlink(imagePath, (err) => {
                    if (err) console.error("Lỗi khi xóa ảnh game:", err);
                });
            });

        } catch (error) {
            console.error("Lỗi khi tạo game gõ chữ:", error);
            api.sendMessage("Đã có lỗi xảy ra, không thể bắt đầu game. Vui lòng thử lại sau.", threadID);
        }
    },

    handleReply: async function ({ api, event, handleReply }) {
        const { threadID, senderID, body, messageID } = event;
        const { author, correctAnswer, startTime, messageID: originalMessageID } = handleReply;

        if (senderID !== author) return;

        const userAnswer = body.trim();
        const timeTaken = Date.now() - startTime;

        const replyIndex = global.client.handleReply.findIndex(r => r.messageID === originalMessageID);
        if (replyIndex !== -1) {
            global.client.handleReply.splice(replyIndex, 1);
        }
        
        api.unsendMessage(originalMessageID).catch(e => console.log(e));

        if (timeTaken > GAME_DURATION * 1000) {
            return api.sendMessage("⌛ Hết giờ! Bạn đã không kịp phản hồi.", threadID, messageID);
        }

        if (userAnswer === correctAnswer) {
            const timeInSeconds = timeTaken / 1000;
            const words = correctAnswer.split(' ').length;
            const wpm = Math.round((words / timeInSeconds) * 60);

            playerAttempts.delete(senderID);

api.sendMessage(
  "✅ CHÍNH XÁC!\n" +
  "------------\n" +
  `🕒 Thời gian: ${timeTaken}ms\n` +
  `📈 Tốc độ: ~${wpm} WPM (từ/phút)\n` +
  "------------",
  threadID,
  messageID
);

        } else {
            let attemptData = playerAttempts.get(senderID) || { count: 0 };
            attemptData.count++;

            if (attemptData.count >= WRONG_ATTEMPT_LIMIT) {
                attemptData.penaltyUntil = Date.now() + PENALTY_COOLDOWN_MINUTES * 60 * 1000;
                attemptData.count = 0;
                playerAttempts.set(senderID, attemptData);
                api.sendMessage(`❌ Bạn đã gõ sai ${WRONG_ATTEMPT_LIMIT} lần! Tạm khóa chơi trong ${PENALTY_COOLDOWN_MINUTES} phút.`, threadID, messageID);
            } else {
                playerAttempts.set(senderID, attemptData);
                api.sendMessage(
                    `❌ Sai rồi! Bạn còn ${WRONG_ATTEMPT_LIMIT - attemptData.count} lần thử.\n` +
                    `- Bạn đã gõ: "${userAnswer}"\n` +
                    `- Đáp án đúng: "${correctAnswer}"`,
                    threadID, messageID
                );
            }
        }
    }
};
