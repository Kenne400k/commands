const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// --- CẤU HÌNH GAME ---
const COOLDOWN_SECONDS = 10; // Tăng cooldown để tránh spam
const DIFFICULTY_LEVELS = {
    "dễ": {
        grid: { rows: 2, cols: 2 },
        duration: 45, // giây
        numObjects: 3,
        reward: 500, // Tiền thưởng
        penalty: 100 // Tiền phạt
    },
    "thường": {
        grid: { rows: 3, cols: 3 },
        duration: 60,
        numObjects: 7,
        reward: 1500,
        penalty: 300
    },
    "khó": {
        grid: { rows: 4, cols: 4 },
        duration: 75,
        numObjects: 12,
        reward: 3000,
        penalty: 500
    }
};

// --- HÀM VẼ VẬT THỂ (NÂNG CẤP) ---
// Thêm hiệu ứng đổ bóng và xoay cho tất cả vật thể
function drawWithEffects(ctx, x, y, size, rotation, drawFunc) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);

    // Thêm hiệu ứng đổ bóng
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    drawFunc(ctx, 0, 0, size); // Vẽ tại gốc tọa độ mới (0,0)
    ctx.restore();
}

function drawKey(ctx, x, y, size) {
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = size * 0.1;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, size * 0.2, 0, Math.PI * 2); // Vòng tròn
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + size * 0.4); // Thân chìa
    ctx.moveTo(x, y + size * 0.1);
    ctx.lineTo(x + size * 0.2, y + size * 0.1); // Răng 1
    ctx.moveTo(x, y + size * 0.3);
    ctx.lineTo(x + size * 0.2, y + size * 0.3); // Răng 2
    ctx.stroke();
}

function drawStar(ctx, x, y, size) {
    const grad = ctx.createRadialGradient(x, y, size * 0.1, x, y, size * 0.5);
    grad.addColorStop(0, '#f9ca24');
    grad.addColorStop(1, '#f39c12');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.5);
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(
            x + Math.cos((18 + i * 72) / 180 * Math.PI) * size * 0.5,
            y - Math.sin((18 + i * 72) / 180 * Math.PI) * size * 0.5
        );
        ctx.lineTo(
            x + Math.cos((54 + i * 72) / 180 * Math.PI) * size * 0.2,
            y - Math.sin((54 + i * 72) / 180 * Math.PI) * size * 0.2
        );
    }
    ctx.closePath();
    ctx.fill();
}

function drawHeart(ctx, x, y, size) {
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.25);
    ctx.bezierCurveTo(x, y, x - size * 0.5, y - size * 0.25, x - size * 0.5, y);
    ctx.bezierCurveTo(x - size * 0.5, y + size * 0.25, x, y + size * 0.5, x, y + size * 0.75);
    ctx.bezierCurveTo(x, y + size * 0.5, x + size * 0.5, y + size * 0.25, x + size * 0.5, y);
    ctx.bezierCurveTo(x + size * 0.5, y - size * 0.25, x, y, x, y + size * 0.25);
    ctx.fill();
}

// Thêm các vật thể mới
function drawDiamond(ctx, x, y, size) {
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.5); // Top
    ctx.lineTo(x + size * 0.4, y); // Right
    ctx.lineTo(x, y + size * 0.5); // Bottom
    ctx.lineTo(x - size * 0.4, y); // Left
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = size * 0.05;
    ctx.stroke();
}

function drawCloud(ctx, x, y, size) {
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.arc(x - size * 0.2, y + size * 0.1, size * 0.25, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(x + size * 0.1, y - size * 0.1, size * 0.3, Math.PI * 1, Math.PI * 2);
    ctx.arc(x + size * 0.3, y + size * 0.1, size * 0.2, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
}

function drawLightning(ctx, x, y, size) {
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(x + size * 0.2, y - size * 0.5);
    ctx.lineTo(x - size * 0.2, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x - size * 0.2, y + size * 0.5);
    ctx.lineTo(x + size * 0.2, y - size*0.1);
    ctx.lineTo(x, y - size * 0.1);
    ctx.closePath();
    ctx.fill();
}


// --- DANH SÁCH CÁC VẬT THỂ CÓ THỂ VẼ (ĐA DẠNG HƠN) ---
const availableObjects = [
    { name: 'Chìa khoá', drawFunc: drawKey },
    { name: 'Ngôi sao', drawFunc: drawStar },
    { name: 'Trái tim', drawFunc: drawHeart },
    { name: 'Kim cương', drawFunc: drawDiamond },
    { name: 'Đám mây', drawFunc: drawCloud },
    { name: 'Tia sét', drawFunc: drawLightning },
    { name: 'Ngôi nhà', drawFunc: (ctx, x, y, size) => {
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(x - size * 0.25, y, size * 0.5, size * 0.5); // Thân nhà
        ctx.fillStyle = '#8e44ad';
        ctx.beginPath(); // Mái nhà
        ctx.moveTo(x - size * 0.4, y);
        ctx.lineTo(x + size * 0.4, y);
        ctx.lineTo(x, y - size * 0.4);
        ctx.closePath();
        ctx.fill();
    }},
    { name: 'Cây thông', drawFunc: (ctx, x, y, size) => {
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.5);
        ctx.lineTo(x - size * 0.3, y);
        ctx.lineTo(x + size * 0.3, y);
        ctx.closePath();
        ctx.moveTo(x, y - size * 0.2);
        ctx.lineTo(x - size * 0.4, y + size * 0.3);
        ctx.lineTo(x + size * 0.4, y + size * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(x - size * 0.1, y + size * 0.3, size * 0.2, size * 0.2);
    }}
];

// --- HÀM TẠO ẢNH GAME (NÂNG CẤP VISUAL) ---
async function createGameImage(objectsToDraw, targetName, gridSize) {
    const width = 900, height = 900;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Nền Gradient và Họa tiết
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#34495e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Họa tiết chấm bi
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 1000; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. Vẽ lưới và số thứ tự
    const cellWidth = width / gridSize.cols;
    const cellHeight = height / gridSize.rows;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    for (let i = 1; i < gridSize.cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellWidth, 0); ctx.lineTo(i * cellWidth, height - 120); ctx.stroke();
    }
    for (let i = 1; i < gridSize.rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellHeight); ctx.lineTo(width, i * cellHeight); ctx.stroke();
    }

    // Vẽ số thứ tự
    ctx.font = 'bold 35px "Signika-SemiBold"';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    let cellNumber = 1;
    for (let row = 0; row < gridSize.rows; row++) {
        for (let col = 0; col < gridSize.cols; col++) {
            ctx.fillText(cellNumber.toString(), col * cellWidth + 20, row * cellHeight + 35);
            cellNumber++;
        }
    }

    // 3. Vẽ các vật thể
    objectsToDraw.forEach(obj => {
        const row = Math.floor((obj.cell - 1) / gridSize.cols);
        const col = (obj.cell - 1) % gridSize.cols;
        const centerX = col * cellWidth + cellWidth / 2;
        const centerY = row * cellHeight + cellHeight / 2;
        drawWithEffects(ctx, centerX, centerY, obj.size, obj.rotation, obj.drawFunc);
    });

    // 4. Vẽ tiêu đề và hướng dẫn (thiết kế lại)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, height - 120, width, 120);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, height-120, width, 120);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 60px "Signika-SemiBold"';
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 10;
    ctx.fillText(`Hãy tìm: ${targetName}`, width / 2, height - 60);

    return canvas.toBuffer('image/png');
}

module.exports = {
    config: {
        name: "timvatthe",
        version: "2.0.0",
        hasPermission: 0,
        credits: "Pcoder", //canvas by AI
        description: "Trò chơi tìm vật thể với nhiều độ khó, đồ họa nâng cấp và hệ thống thưởng.",
        commandCategory: "game",
        usages: "[dễ | thường | khó]",
        cooldowns: COOLDOWN_SECONDS
    },

    onLoad: async function() {
        const cacheDir = path.join(__dirname, 'cache');
        await fs.ensureDir(cacheDir);
        const fontUrl = 'https://github.com/Kenne400k/font/raw/refs/heads/main/Signika-SemiBold.ttf';
        const fontPath = path.join(cacheDir, 'Signika-SemiBold.ttf');
        if (!fs.existsSync(fontPath)) {
            try {
                const response = await axios.get(fontUrl, { responseType: 'stream' });
                const writer = fs.createWriteStream(fontPath);
                response.data.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
            } catch (error) { console.error("Lỗi tải font:", error.message); }
        }
        try {
            registerFont(fontPath, { family: "Signika-SemiBold" });
        } catch(e) { console.error("Lỗi đăng ký font:", e); }
    },

    run: async function ({ api, event, args, Currencies }) {
        const { threadID, senderID } = event;

        // Chọn độ khó
        let difficulty = args[0]?.toLowerCase() || 'thường';
        if (!DIFFICULTY_LEVELS[difficulty]) {
            difficulty = 'thường';
        }
        const settings = DIFFICULTY_LEVELS[difficulty];
        const { grid: GRID_SIZE, duration: GAME_DURATION, numObjects: NUM_OBJECTS_TO_SHOW, reward, penalty } = settings;

        // 1. Chuẩn bị dữ liệu game
        const totalCells = GRID_SIZE.rows * GRID_SIZE.cols;
        const cellNumbers = Array.from({ length: totalCells }, (_, i) => i + 1);

        const shuffledObjects = [...availableObjects].sort(() => 0.5 - Math.random());
        const shuffledCells = cellNumbers.sort(() => 0.5 - Math.random());
        
        const objectsToDraw = shuffledObjects.slice(0, Math.min(NUM_OBJECTS_TO_SHOW, totalCells)).map((obj, index) => ({
            ...obj,
            cell: shuffledCells[index],
            rotation: Math.random() * 360, // Xoay ngẫu nhiên
            size: 80 + Math.random() * 40,  // Kích thước ngẫu nhiên (80-120)
        }));

        const targetObject = objectsToDraw[Math.floor(Math.random() * objectsToDraw.length)];

        try {
            const imageBuffer = await createGameImage(objectsToDraw, targetObject.name, GRID_SIZE);
            const imagePath = path.join(__dirname, `cache/find_object_${threadID}.png`);
            await fs.writeFile(imagePath, imageBuffer);

            const msg = {
                body: `🔥 **TÌM VẬT THỂ - Cấp độ: ${difficulty.toUpperCase()}** 🔥\n\nBạn có ${GAME_DURATION} giây để tìm **${targetObject.name}**!\n🎁 Phần thưởng: **${reward}$**\n💀 Phạt nếu sai: **${penalty}$**\n\nReply tin nhắn này với số ô bạn chọn.`,
                attachment: fs.createReadStream(imagePath)
            };
            
            api.sendMessage(msg, threadID, (err, info) => {
                if (err) return console.error(err);
                
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    correctCell: targetObject.cell,
                    targetName: targetObject.name,
                    startTime: Date.now(),
                    gameSettings: settings,
                    totalCells: totalCells
                });
                
                fs.unlink(imagePath, (err) => {
                    if (err) console.error("Lỗi khi xóa ảnh game:", err);
                });
            });

        } catch (error) {
            console.error("Lỗi khi tạo game Tìm Vật Thể:", error);
            api.sendMessage("Đã có lỗi xảy ra, không thể bắt đầu game.", threadID);
        }
    },

    handleReply: async function ({ api, event, handleReply, Currencies }) {
        const { threadID, senderID, body, messageID } = event;
        const { author, correctCell, targetName, startTime, gameSettings, totalCells, messageID: originalMessageID } = handleReply;

        if (senderID !== author) return;

        const timeTaken = (Date.now() - startTime);

        // Xóa handleReply để tránh trả lời nhiều lần
        const replyIndex = global.client.handleReply.findIndex(r => r.messageID === originalMessageID);
        if (replyIndex !== -1) {
            global.client.handleReply.splice(replyIndex, 1);
        }
        
        // Gỡ tin nhắn game
        api.unsendMessage(originalMessageID).catch(e => console.log("Không thể gỡ tin nhắn game:", e));

        if (timeTaken > gameSettings.duration * 1000) {
            return api.sendMessage(`⌛ Hết giờ! **${targetName}** đã ở ô số **${correctCell}**. Bạn không nhận được thưởng.`, threadID, messageID);
        }

        const userChoice = parseInt(body.trim());
        if (isNaN(userChoice) || userChoice < 1 || userChoice > totalCells) {
            return api.sendMessage(`Vui lòng chỉ trả lời bằng một số từ 1 đến ${totalCells}.`, threadID, messageID);
        }

        const userMoney = (await Currencies.getData(senderID))?.money || 0;

        if (userChoice === correctCell) {
            // Thưởng tiền dựa trên thời gian
            const timeBonusFactor = Math.max(0.1, 1 - (timeTaken / (gameSettings.duration * 1000)));
            const earnedMoney = Math.round(gameSettings.reward * timeBonusFactor);
            await Currencies.increaseMoney(senderID, earnedMoney);
            
            api.sendMessage(
                `🎉 **Chính xác!**\nBạn đã tìm thấy **${targetName}** ở ô số **${correctCell}** trong ${timeTaken/1000} giây.\n💰 Bạn nhận được **${earnedMoney}$** tiền thưởng!`,
                threadID, messageID
            );
        } else {
            const penaltyAmount = Math.min(userMoney, gameSettings.penalty);
            await Currencies.decreaseMoney(senderID, penaltyAmount);

            api.sendMessage(
                `❌ **Sai rồi!** Bạn đã chọn ô số ${userChoice}.\nĐáp án đúng là **${targetName}** ở ô số **${correctCell}**.\n💸 Bạn bị trừ **${penaltyAmount}$**.`,
                threadID, messageID
            );
        }
    }
};
