const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const moment = require('moment-timezone');

// --- CÁC HÀM TIỆN ÍCH ---

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line.trim(), x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line.trim(), x, y);
}

async function getAvatarBuffer(url) {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(res.data, 'binary');
    } catch (e) {
        console.error("Lỗi khi tải avatar, sử dụng ảnh mặc định.", e.message);
        const canvas = createCanvas(200, 200);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "#2E2E2E"; ctx.fillRect(0, 0, 200, 200);
        return canvas.toBuffer();
    }
}

// --- KHỞI TẠO VÀ TẢI DỮ LIỆU (ĐÃ CẬP NHẬT FONT) ---
(async () => {
    const cacheDir = path.join(__dirname, '../../cache');
    await fs.ensureDir(cacheDir);

    const fontUrls = [
        { url: 'https://github.com/Kenne400k/font/raw/refs/heads/main/Lobster-Regular.ttf', filename: 'Lobster-Regular.ttf' },
        { url: 'https://github.com/Kenne400k/font/raw/refs/heads/main/Signika-SemiBold.ttf', filename: 'Signika-SemiBold.ttf' }
    ];

    const backgroundUrls = [
        'https://raw.githubusercontent.com/Kenne400k/commands/main/4k-Windows-11-Wallpaper-scaled.jpg',
        'https://raw.githubusercontent.com/Kenne400k/commands/main/HD-wallpaper-chill-vibes-3440-1440-r-chill-art.jpg',
        'https://raw.githubusercontent.com/Kenne400k/commands/main/hinh-nen-chill-cho-may-tinh-dep_040228906.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/chill-4k-animal-camping-art-hdk4nyjo64bvg4ko-hdk4nyjo64bvg4ko.jpg', 
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/chill-out-snow-anime-girls-maple-leaf-wallpaper-preview.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/d1e1a3ed8d55b9d626ede8b202115f38.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/hinh-nen-chill-78-1024x640.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/hinh-nen-chill-82-1024x640.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/images%20(3).jpeg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/japanese-castle-cherry-blossom-mountain-digital-art-scenery-4k-wallpaper-uhdpaper.com-702@1@k.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/landscape-anime-digital-art-fantasy-art-wallpaper-preview.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/looking-far-away-4k-lb.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/wp9322415.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg1.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg2.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg3.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg4.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg5.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg6.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg7.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg8.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg9.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg10.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg11.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg12.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg13.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg14.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg15.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg16.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg17.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg18.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg19.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg21.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg22.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg23.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg24.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg25.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg26.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg27.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg28.jpg',
        'https://raw.githubusercontent.com/Kenne400k/background/refs/heads/main/bg29.jpg'
        
    ];
    
    for (const font of fontUrls) {
        const localPath = path.join(cacheDir, font.filename);
        if (!fs.existsSync(localPath)) {
            try {
                const response = await axios({ method: 'GET', url: font.url, responseType: 'stream' });
                response.data.pipe(fs.createWriteStream(localPath));
            } catch (error) { console.error(`[DOWNLOADER] Lỗi khi tải ${font.filename}:`, error.message); }
        }
    }
    
    try {
        // --- ĐĂNG KÝ FONT MỚI ---
        registerFont(path.join(cacheDir, 'Lobster-Regular.ttf'), { family: "Lobster-Regular"});
        registerFont(path.join(cacheDir, 'Signika-SemiBold.ttf'), { family: "Signika-SemiBold"});
    } catch (e) { console.error("[FONT-LOADER] Lỗi đăng ký font.", e); }

    for (let i = 0; i < backgroundUrls.length; i++) {
        const url = backgroundUrls[i];
        const ext = path.extname(url).split('?')[0] || '.jpg';
        const localPath = path.join(cacheDir, `bg_welcome_${i}${ext}`);
        if (!fs.existsSync(localPath)) {
            try {
                const response = await axios({ method: 'GET', url, responseType: 'arraybuffer' });
                fs.writeFileSync(localPath, response.data);
            } catch (error) { console.error(`[DOWNLOADER] Lỗi khi tải background:`, error.message); }
        }
    }
})();

// --- HÀM TẠO ẢNH CHÍNH (ĐÃ CẬP NHẬT FONT) ---

async function makeWelcomeImage({ avatarUrl, name, groupName, memberCount }) {
    const width = 1200, height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const cacheDir = path.join(__dirname, '../../cache');

    try {
        const bgFiles = fs.readdirSync(cacheDir).filter(f => f.startsWith('bg_welcome_'));
        const randomBgPath = path.join(cacheDir, bgFiles[Math.floor(Math.random() * bgFiles.length)]);
        const bgImage = await loadImage(randomBgPath);
        
        const imgRatio = bgImage.width / bgImage.height;
        const canvasRatio = width / height;
        let sx = 0, sy = 0, sWidth = bgImage.width, sHeight = bgImage.height;
        if (imgRatio > canvasRatio) { 
            sWidth = sHeight * canvasRatio; 
            sx = (bgImage.width - sWidth) / 2; 
        } else { 
            sHeight = sWidth / canvasRatio; 
            sy = (bgImage.height - sHeight) / 2; 
        }
        ctx.drawImage(bgImage, sx, sy, sWidth, sHeight, 0, 0, width, height);

    } catch (e) {
        ctx.fillStyle = '#2c2c2c'; ctx.fillRect(0, 0, width, height);
        console.error("Lỗi khi vẽ background:", e.message);
    }

    ctx.save();
    const padding = 50;
    const boxX = padding;
    const boxY = padding;
    const boxWidth = width - padding * 2;
    const boxHeight = height - padding * 2;
    const borderRadius = 35;
    drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, borderRadius);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 80;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    const avatarSize = 180;
    const avatarX = boxX + 50;
    const avatarY = height / 2 - avatarSize / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = "#FFFFFF";
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    const avatar = await loadImage(await getAvatarBuffer(avatarUrl));
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    const textAreaX = avatarX + avatarSize + 50;
    const textAreaY = boxY + 140; 
    const maxWidth = boxWidth - (avatarX - boxX) - avatarSize - 70;

const rainbowColors = ["#ff3838", "#ff9f1a", "#fff200", "#32ff7e", "#18dcff", "#7d5fff", "#f368e0"];

ctx.font = `bold 40px "Signika-SemiBold"`;
const welcomeText = "WELCOME";
ctx.fillStyle = "#FFFFFF";
ctx.shadowColor = "rgba(50, 255, 200, 0.9)"; 
ctx.shadowBlur = 40;
ctx.fillText(welcomeText, textAreaX, textAreaY);
ctx.shadowColor = "transparent";

const welcomeTextMetrics = ctx.measureText(welcomeText); 

let nameFontSize = 40;
const nameText = ` ${name}`;
ctx.font = `bold ${nameFontSize}px "Lobster-Regular"`;

while (welcomeTextMetrics.width + ctx.measureText(nameText).width > maxWidth && nameFontSize > 10) {
    nameFontSize--;
    ctx.font = `bold ${nameFontSize}px "Lobster-Regular"`;
}

const nameX = textAreaX + welcomeTextMetrics.width;
const nameWidth = ctx.measureText(nameText).width;
const nameGrad = ctx.createLinearGradient(nameX, 0, nameX + nameWidth, 0);
rainbowColors.forEach((color, i) => nameGrad.addColorStop(i / (rainbowColors.length - 1), color));

ctx.fillStyle = nameGrad;
ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
ctx.shadowBlur = 35;
ctx.fillText(nameText, nameX, textAreaY);
ctx.shadowColor = "transparent";
    const introY = textAreaY + 60;
    ctx.font = 'regular 20px "Signika-SemiBold"'; 
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`Là thành viên thứ ${memberCount} của nhóm ${groupName}.`, textAreaX, introY);

    const quoteY = introY + 45;
    ctx.font = 'regular 15px "Signika-SemiBold"'; 
    ctx.fillStyle = "#FFFFFF";
    const randomContent = `Chúc bạn có những giây phút vui vẻ và ý nghĩa!`;
    wrapText(ctx, randomContent, textAreaX, quoteY, maxWidth, 30);
    
    return canvas.toBuffer('image/png');
}



module.exports.config = {
    name: "userjoin",
    eventType: ["log:subscribe"],
    version: "12.2.0", 
    credits: "Pcoder",
    description: "Chào mừng thành viên mới với canvas",
    dependencies: {
        "canvas": "", "axios": "", "fs-extra": "", "path": "", "moment-timezone": ""
    }
};

module.exports.run = async function({ api, event, Threads }) {
    if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) return;
    
    const { threadID, logMessageData } = event;
    
    try {
        const threadInfo = await Threads.getInfo(threadID);
        const groupName = threadInfo.threadName || "nhóm";
        
        for (const participant of logMessageData.addedParticipants) {
            const userId = participant.userFbId;
            const name = participant.fullName;
            const memberCount = threadInfo.participantIDs.length;
            const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=1080&height=1080&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
            
            const imgBuffer = await makeWelcomeImage({
                avatarUrl, 
                name, 
                groupName, 
                memberCount
            });
            
            const imgPath = path.join(__dirname, `../../cache/welcome_${userId}.png`);
            await fs.writeFile(imgPath, imgBuffer);
            
            api.sendMessage({
                body: `👋 Chào mừng ${name} đã đến với ${groupName}!\nMọi người cùng làm quen với thành viên mới nhé.`,
                mentions: [{ tag: name, id: userId }],
                attachment: fs.createReadStream(imgPath)
            }, threadID, () => fs.unlink(imgPath, (err) => {
                if (err) console.error("Lỗi khi xóa ảnh welcome:", err);
            }));
        }
    } catch (err) {
        console.error("Lỗi trong joinNoti:", err);
    }
}
