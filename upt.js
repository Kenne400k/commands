const os = require('os');
const moment = require('moment-timezone');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

const thuMucCache = path.join(__dirname, 'cache');
let taiNguyenDaSanSang = false;

function dinhDangThoiGianHoatDong(uptimeSeconds) {
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

async function laySuDungCPU() {
    const startUsage = process.cpuUsage();
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100));
    const endUsage = process.cpuUsage(startUsage);
    const duration = Date.now() - startTime;
    return (((endUsage.user + endUsage.system) / 1000) / duration * 100).toFixed(1);
}

function veHinhChuNhatBoGoc(ctx, x, y, width, height, radius) {
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
    ctx.fill();
}

function veThanhTienTrinh(ctx, x, y, width, height, progress) {
    ctx.save();
    ctx.fillStyle = '#444953';
    veHinhChuNhatBoGoc(ctx, x, y, width, height, height / 2);

    const barWidth = (width - 4) * progress;
    if (barWidth > 0) {
        let gradientColors;
        if (progress < 0.5) gradientColors = ['#32ff7e', '#18dcff'];
        else if (progress < 0.8) gradientColors = ['#fff200', '#ff9f1a'];
        else gradientColors = ['#ff9f1a', '#ff3838'];

        const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
        gradient.addColorStop(0, gradientColors[0]);
        gradient.addColorStop(1, gradientColors[1]);
        ctx.fillStyle = gradient;
        veHinhChuNhatBoGoc(ctx, x + 2, y + 2, barWidth, height - 4, (height - 4) / 2);
    }
    
    ctx.font = '600 20px "Signika"';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${(progress * 100).toFixed(1)}%`, x + width / 2, y + height / 2 + 1);
    ctx.restore();
}

async function taoAnhThongKe({ thongTinBot, thongTinHeThong, thongTinHieuSuat }) {
    const width = 1200, height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const danhSachAnhNen = fs.readdirSync(thuMucCache).filter(f => f.startsWith('bg_upt_'));
        const anhNen = await loadImage(path.join(thuMucCache, danhSachAnhNen[Math.floor(Math.random() * danhSachAnhNen.length)]));
        const imgRatio = anhNen.width / anhNen.height, canvasRatio = width / height;
        let sx = 0, sy = 0, sWidth = anhNen.width, sHeight = anhNen.height;
        if (imgRatio > canvasRatio) { sWidth = sHeight * canvasRatio; sx = (anhNen.width - sWidth) / 2; } 
        else { sHeight = sWidth / canvasRatio; sy = (anhNen.height - sHeight) / 2; }
        ctx.drawImage(anhNen, sx, sy, sWidth, sHeight, 0, 0, width, height);
    } catch {
        ctx.fillStyle = '#242526';
        ctx.fillRect(0, 0, width, height);
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = "center";
    ctx.font = '600 55px "Signika"';
    const titleGradient = ctx.createLinearGradient(0, 0, width, 0);
    titleGradient.addColorStop(0.2, "#32ff7e");
    titleGradient.addColorStop(0.8, "#18dcff");
    ctx.fillStyle = titleGradient;
    ctx.shadowColor = "rgba(0, 255, 150, 0.7)";
    ctx.shadowBlur = 15;
    ctx.fillText("SYSTEM DASHBOARD", width / 2, 80);
    ctx.shadowBlur = 0;

    const toaDoCot1 = 70, toaDoCot2 = 650;
    let viTriY1 = 180, viTriY2 = 180;
    const chieuCaoDong = 45;

    ctx.textAlign = 'left';
    const veDongThongTin = (x, y, label, value) => {
        ctx.font = '600 24px "Signika"';
        ctx.fillStyle = '#B0BEC5';
        ctx.fillText(label, x, y);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(value, x + 180, y);
    };

    const veTieuDePhan = (x, y, title, color) => {
        ctx.font = '600 32px "Signika"';
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillText(title, x, y);
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(x, y + 15);
        ctx.lineTo(x + 480, y + 15);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
        return y + 60;
    };

    viTriY1 = veTieuDePhan(toaDoCot1, viTriY1, "THÔNG TIN BOT", "#18dcff");
    veDongThongTin(toaDoCot1, viTriY1, "Uptime:", thongTinBot.uptime); viTriY1 += chieuCaoDong;
    veDongThongTin(toaDoCot1, viTriY1, "Ping:", `${thongTinBot.ping} ms`); viTriY1 += chieuCaoDong;
    veDongThongTin(toaDoCot1, viTriY1, "Prefix:", thongTinBot.prefix); viTriY1 += chieuCaoDong;
    veDongThongTin(toaDoCot1, viTriY1, "Lệnh:", `${thongTinBot.commands} lệnh`); viTriY1 += chieuCaoDong;
    veDongThongTin(toaDoCot1, viTriY1, "Người dùng:", `${thongTinBot.users} người`); viTriY1 += chieuCaoDong;
    veDongThongTin(toaDoCot1, viTriY1, "Nhóm:", `${thongTinBot.groups} nhóm`); viTriY1 += 60;

    viTriY1 = veTieuDePhan(toaDoCot1, viTriY1, "HỆ THỐNG", "#18dcff");
    veDongThongTin(toaDoCot1, viTriY1, "Hệ điều hành:", thongTinHeThong.os); viTriY1 += chieuCaoDong;
    veDongThongTin(toaDoCot1, viTriY1, "Nền tảng:", thongTinHeThong.platform); viTriY1 += chieuCaoDong;
    veDongThongTin(toaDoCot1, viTriY1, "Node.js:", thongTinHeThong.nodeVersion);

    viTriY2 = veTieuDePhan(toaDoCot2, viTriY2, "HIỆU SUẤT", "#32ff7e");
    
    ctx.font = '600 24px "Signika"';
    ctx.fillStyle = '#B0BEC5';
    ctx.fillText(`CPU (${thongTinHieuSuat.cpuCores} Cores):`, toaDoCot2, viTriY2);
    veThanhTienTrinh(ctx, toaDoCot2, viTriY2 + 30, 480, 30, thongTinHieuSuat.cpuUsage / 100);
    viTriY2 += 90;

    ctx.fillText(`RAM (${thongTinHieuSuat.totalRam}MB):`, toaDoCot2, viTriY2);
    veThanhTienTrinh(ctx, toaDoCot2, viTriY2 + 30, 480, 30, thongTinHieuSuat.usedRam / thongTinHieuSuat.totalRam);
    viTriY2 += 90;

    ctx.fillText(`HEAP (${thongTinHieuSuat.totalHeap}MB):`, toaDoCot2, viTriY2);
    veThanhTienTrinh(ctx, toaDoCot2, viTriY2 + 30, 480, 30, thongTinHieuSuat.usedHeap / thongTinHieuSuat.totalHeap);
    
    ctx.textAlign = 'center';
    ctx.font = '600 20px "Signika"';
    ctx.fillStyle = '#B0BEC5';
    ctx.fillText(`Dashboard cập nhật lúc ${moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss DD/MM/YYYY')}`, width / 2, height - 50);

    ctx.textAlign = 'right'; 
    ctx.font = '600 18px "Signika"'; 
    ctx.fillStyle = 'rgba(176, 190, 197, 0.8)'; 
    ctx.fillText("Created by Nguyễn Trương Thiện Phát (Pcoder)", width - 30, height - 25);
    
    const duongDanAnh = path.join(thuMucCache, `upt_${Date.now()}.png`);
    fs.writeFileSync(duongDanAnh, canvas.toBuffer('image/png'));
    return duongDanAnh;
}

async function khoiTaoTaiNguyen() {
    await fs.ensureDir(thuMucCache);
    const danhSachFont = [{ url: 'https://github.com/Kenne400k/font/raw/refs/heads/main/Signika-SemiBold.ttf', filename: 'Signika-SemiBold.ttf' }];
    const danhSachAnhNen = [
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
    
    for (const font of danhSachFont) {
        const duongDanLocal = path.join(thuMucCache, font.filename);
        if (!fs.existsSync(duongDanLocal)) {
            try {
                const response = await axios({ method: 'GET', url: font.url, responseType: 'stream' });
                response.data.pipe(fs.createWriteStream(duongDanLocal));
            } catch (error) { console.error(`[UPT] Lỗi tải font ${font.filename}:`, error.message); }
        }
    }
    for (let i = 0; i < danhSachAnhNen.length; i++) {
        const url = danhSachAnhNen[i];
        const duongDanLocal = path.join(thuMucCache, `bg_upt_${i}.jpg`);
        if (!fs.existsSync(duongDanLocal)) {
            try {
                const response = await axios({ method: 'GET', url, responseType: 'arraybuffer' });
                fs.writeFileSync(duongDanLocal, response.data);
            } catch (error) { console.error(`[UPT] Lỗi tải background:`, error.message); }
        }
    }
    try {
        registerFont(path.join(thuMucCache, 'Signika-SemiBold.ttf'), { family: "Signika", weight: "600" });
        taiNguyenDaSanSang = true;
        console.log("[UPT] Đã tải và đăng ký tài nguyên thành công.");
    } catch (e) { console.error("[UPT] Lỗi đăng ký font, không thể sử dụng lệnh:", e); }
}

khoiTaoTaiNguyen(); 

async function layDuLieuHeThong(eventTimestamp) {
    const cpuUsage = await laySuDungCPU();
    const tongRam = os.totalmem(), ramTrong = os.freemem(), boNhoHeap = process.memoryUsage();
    
    const thongTinBot = {
        uptime: dinhDangThoiGianHoatDong(process.uptime()),
        ping: Date.now() - eventTimestamp,
        prefix: global.config.PREFIX || "#",
        commands: global.client.commands.size,
        users: global.data.allUserID.length,
        groups: global.data.allThreadID.length
    };

    const thongTinHeThong = {
        os: os.type(),
        platform: os.platform(),
        nodeVersion: process.version
    };

    const thongTinHieuSuat = {
        cpuCores: os.cpus().length,
        cpuUsage: parseFloat(cpuUsage),
        totalRam: Math.round(tongRam / 1048576),
        usedRam: Math.round((tongRam - ramTrong) / 1048576),
        totalHeap: Math.round(boNhoHeap.heapTotal / 1048576),
        usedHeap: Math.round(boNhoHeap.heapUsed / 1048576)
    };
    
    return { thongTinBot, thongTinHeThong, thongTinHieuSuat };
}

module.exports.config = {
    name: "upt",
    version: "7.0.0", 
    hasPermission: 2,
    credits: "Nguyễn Trương Thiện Phát (Pcoder)",
    description: "Hiển thị dashboard hệ thống",
    commandCategory: "Admin",
    usages: "",
    cooldowns: 10
};

module.exports.handleEvent = async ({ api, event }) => {
    const content = event.body?.toLowerCase().trim();
    if (!["upt", "cpu", "ram"].includes(content)) return;
    if (!taiNguyenDaSanSang) {
        return api.sendMessage("🕓 Bot đang tải tài nguyên (ảnh, font...), vui lòng thử lại sau.", event.threadID);
    }

    const msgWait = await api.sendMessage("🧠 Đang tạo ảnh thống kê, vui lòng chờ...", event.threadID);

    let imagePath;
    try {
        const duLieu = await layDuLieuHeThong(event.timestamp);
        imagePath = await taoAnhThongKe(duLieu);

        await api.sendMessage({
            body: "📈 Thống kê hệ thống hiện tại:",
            attachment: fs.createReadStream(imagePath)
        }, event.threadID, () => api.unsendMessage(msgWait.messageID));

    } catch (err) {
        console.error("❌ handleEvent UPT error:", err);
        api.sendMessage("⚠️ Đã xảy ra lỗi khi xử lý ảnh thống kê.", event.threadID, event.messageID);
    } finally {
        if (imagePath) try { fs.unlinkSync(imagePath); } catch {}
    }
};

module.exports.run = async ({ api, event, args }) => {
    if (!taiNguyenDaSanSang) {
        return api.sendMessage("🕓 Bot đang khởi tạo tài nguyên, vui lòng thử lại sau giây lát...", event.threadID, event.messageID);
    }

    let type = args[0]?.toLowerCase() || "all";
    if (!["cpu", "ram", "all"].includes(type)) type = "all";

    let imagePath;
    try {
        const startTime = Date.now();
        const duLieu = await layDuLieuHeThong(startTime);
        imagePath = await taoAnhThongKe(duLieu);

        await api.sendMessage({
            body: "📊 Đây là ảnh thống kê hệ thống.",
            attachment: fs.createReadStream(imagePath)
        }, event.threadID, event.messageID);

    } catch (err) {
        console.error("❌ run UPT error:", err);
        api.sendMessage("❌ Có lỗi xảy ra khi tạo ảnh hệ thống.", event.threadID, event.messageID);
    } finally {
        if (imagePath) try { fs.unlinkSync(imagePath); } catch {}
    }
};
