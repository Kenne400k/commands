const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const moment = require('moment-timezone');

//================================================================================//
//                             DANH SÁCH BACKGROUND                                //
//================================================================================//
const danhSachAnhNen = [
    'https://raw.githubusercontent.com/Kenne400k/background/main/bg1.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg2.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg3.jpg',
    'https://raw.githubusercontent.com/Kenne400k/background/main/bg4.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg5.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg6.jpg',
    'https://raw.githubusercontent.com/Kenne400k/background/main/bg7.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg8.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg9.jpg',
    'https://raw.githubusercontent.com/Kenne400k/background/main/bg10.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg11.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg12.jpg',
    'https://raw.githubusercontent.com/Kenne400k/background/main/bg13.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg14.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg15.jpg',
    'https://raw.githubusercontent.com/Kenne400k/background/main/bg16.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg17.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg18.jpg',
    'https://raw.githubusercontent.com/Kenne400k/background/main/bg19.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg21.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg22.jpg',
    'https://raw.githubusercontent.com/Kenne400k/background/main/bg23.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg24.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg25.jpg',
    'https://raw.githubusercontent.com/Kenne400k/background/main/bg26.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg27.jpg', 'https://raw.githubusercontent.com/Kenne400k/background/main/bg28.jpg',
    'https://raw.githubusercontent.com/Kenne400k/background/main/bg29.jpg'
];

//================================================================================//
//                             CÁC HÀM TIỆN ÍCH CANVAS                             //
//================================================================================//

function veHinhBoGoc(ctx, x, y, width, height, radius) {
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

function tinhKichThuocVanBanWrap(ctx, text, maxWidth) {
    const words = text.split(' ');
    let line = '';
    let lineCount = 1;
    let textWidth = 0;
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            textWidth = Math.max(textWidth, ctx.measureText(line.trim()).width);
            line = words[n] + ' ';
            lineCount++;
        } else {
            line = testLine;
        }
    }
    textWidth = Math.max(textWidth, ctx.measureText(line.trim()).width);
    return { lineCount, width: textWidth };
}

function vietVanBanWrap(ctx, text, x, y, maxWidth, lineHeight) {
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

async function layBufferAnh(url) {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(res.data, 'binary');
    } catch (e) {
        console.error(`Lỗi khi tải ảnh từ ${url}:`, e.message);
        const canvas = createCanvas(200, 200);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "#2E2E2E";
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = "#FFF";
        ctx.font = '20px "Signika-SemiBold"';
        ctx.textAlign = 'center';
        ctx.fillText('Lỗi Tải Ảnh', 100, 105);
        return canvas.toBuffer();
    }
}

//================================================================================//
//                                  KHỞI TẠO FONT                                  //
//================================================================================//

(async () => {
    const cacheDir = path.join(__dirname, 'cache');
    await fs.ensureDir(cacheDir);
    const danhSachFont = [
        { url: 'https://github.com/Kenne400k/font/raw/refs/heads/main/Lobster-Regular.ttf', filename: 'Lobster-Regular.ttf' },
        { url: 'https://github.com/Kenne400k/font/raw/refs/heads/main/Signika-SemiBold.ttf', filename: 'Signika-SemiBold.ttf' }
    ];
    for (const font of danhSachFont) {
        const localPath = path.join(cacheDir, font.filename);
        if (!fs.existsSync(localPath)) {
            try {
                const response = await axios.get(font.url, { responseType: 'stream' });
                response.data.pipe(fs.createWriteStream(localPath));
            } catch (error) { console.error(`[DOWNLOADER] Lỗi khi tải ${font.filename}:`, error.message); }
        }
    }
    try {
        registerFont(path.join(cacheDir, 'Lobster-Regular.ttf'), { family: "Lobster-Regular" });
        registerFont(path.join(cacheDir, 'Signika-SemiBold.ttf'), { family: "Signika-SemiBold" });
    } catch (e) { console.error("[FONT-LOADER] Lỗi đăng ký font.", e); }
})();

//================================================================================//
//                              HÀM TẠO ẢNH CHÍNH                                //
//================================================================================//

async function taoAnhThongTinNhom(data) {
    const chieuRong = 1920, chieuCao = 1080;
    const canvas = createCanvas(chieuRong, chieuCao);
    const ctx = canvas.getContext('2d');

    try {
        const urlAnhNen = danhSachAnhNen[Math.floor(Math.random() * danhSachAnhNen.length)];
        const anhNen = await loadImage(await layBufferAnh(urlAnhNen));
        const tyLeAnh = anhNen.width / anhNen.height;
        const tyLeCanvas = chieuRong / chieuCao;
        let sourceX = 0, sourceY = 0, sourceWidth = anhNen.width, sourceHeight = anhNen.height;
        if (tyLeAnh > tyLeCanvas) {
            sourceWidth = anhNen.height * tyLeCanvas;
            sourceX = (anhNen.width - sourceWidth) / 2;
        } else {
            sourceHeight = anhNen.width / tyLeCanvas;
            sourceY = (anhNen.height - sourceHeight) / 2;
        }
        ctx.drawImage(anhNen, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, chieuRong, chieuCao);
    } catch (e) {
        ctx.fillStyle = '#2c2c2c'; ctx.fillRect(0, 0, chieuRong, chieuCao);
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, chieuRong, chieuCao);
    
    function veKhungKinhMo(x, y, panelWidth, panelHeight, radius = 35) {
        ctx.save();
        ctx.shadowColor = "rgba(255, 255, 255, 0.15)";
        ctx.shadowBlur = 25;
        veHinhBoGoc(ctx, x, y, panelWidth, panelHeight, radius);
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    const demNgang = 40;
    const kichThuocAvatar = 180;
    const avatarX = demNgang + 40;
    const tenX = avatarX + kichThuocAvatar + 40;
    const tenLineHeight = 90;
    
    ctx.font = `bold 85px "Lobster-Regular"`;
    const thongTinTen = tinhKichThuocVanBanWrap(ctx, data.tenNhom, chieuRong - tenX - demNgang * 2);
    const chieuRongHeader = tenX + thongTinTen.width + 50;
    const chieuCaoHeader = 120 + thongTinTen.lineCount * tenLineHeight;
    veKhungKinhMo(demNgang, demNgang, chieuRongHeader, chieuCaoHeader);

    const avatarY = demNgang + (chieuCaoHeader - kichThuocAvatar) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + kichThuocAvatar / 2, avatarY + kichThuocAvatar / 2, kichThuocAvatar / 2, 0, Math.PI * 2);
    ctx.clip();
    const avatar = await loadImage(await layBufferAnh(data.anhAvatar));
    ctx.drawImage(avatar, avatarX, avatarY, kichThuocAvatar, kichThuocAvatar);
    ctx.restore();

    const tenY = demNgang + (chieuCaoHeader - (thongTinTen.lineCount * tenLineHeight)) / 2 + 70;
    const mauCauVong = ["#ff3838", "#ff9f1a", "#fff200", "#32ff7e", "#18dcff", "#7d5fff", "#f368e0"];
    const minGradientWidth = 600;
    const gradientWidth = Math.max(thongTinTen.width, minGradientWidth);
    const tenGrad = ctx.createLinearGradient(tenX, 0, tenX + gradientWidth, 0);
    mauCauVong.forEach((color, i) => tenGrad.addColorStop(i / (mauCauVong.length - 1), color));
    ctx.fillStyle = tenGrad;
    ctx.textAlign = 'left';
    vietVanBanWrap(ctx, data.tenNhom, tenX, tenY, chieuRong - tenX - demNgang * 2, tenLineHeight);

    const contentY = demNgang + chieuCaoHeader + 30;
    const chieuRongPanel = (chieuRong - demNgang * 4) / 3;
    const chieuCaoPanel = 280;

    veKhungKinhMo(demNgang, contentY, chieuRongPanel, chieuCaoPanel);
    veKhungKinhMo(demNgang * 2 + chieuRongPanel, contentY, chieuRongPanel, chieuCaoPanel);
    veKhungKinhMo(demNgang * 3 + chieuRongPanel * 2, contentY, chieuRongPanel, chieuCaoPanel);
    
    function veDongThongTin(x, y, key, value, keyColor = '#b0b0b0', valueColor = '#FFFFFF') {
        ctx.textAlign = 'left';
        ctx.font = '32px "Signika-SemiBold"';
        ctx.fillStyle = keyColor;
        ctx.fillText(`${key}:`, x, y);
        const keyWidth = ctx.measureText(`${key}: `).width;
        ctx.font = 'bold 32px "Signika-SemiBold"';
        ctx.fillStyle = valueColor;
        ctx.fillText(value, x + keyWidth + 10, y);
    }
    
    const dongHeight = 50;
    let y1 = contentY + 50;
    const x1 = demNgang + 30;
    ctx.font = 'bold 40px "Signika-SemiBold"';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText('Thông Tin Chung', x1, y1);
    y1 += 70;
    veDongThongTin(x1, y1, 'ID Nhóm', data.idNhom);
    y1 += dongHeight;
    veDongThongTin(x1, y1, 'Phê duyệt', data.pheDuyet, '#b0b0b0', data.pheDuyet === 'bật' ? '#32ff7e' : '#ff3838');
    
    let y2 = contentY + 50;
    const x2 = demNgang * 2 + chieuRongPanel + 30;
    ctx.font = 'bold 40px "Signika-SemiBold"';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Thành Viên', x2, y2);
    y2 += 70;
    veDongThongTin(x2, y2, 'Tổng số', `${data.tongThanhVien}`);
    y2 += dongHeight;
    veDongThongTin(x2, y2, 'Nam', data.soNam.toString(), '#b0b0b0', '#18dcff');
    y2 += dongHeight;
    veDongThongTin(x2, y2, 'Nữ', data.soNu.toString(), '#b0b0b0', '#f368e0');
    
    let y3 = contentY + 50;
    const x3 = demNgang * 3 + chieuRongPanel * 2 + 30;
    ctx.font = 'bold 40px "Signika-SemiBold"';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Tương Tác', x3, y3);
    y3 += 70;
    veDongThongTin(x3, y3, 'Tổng tin nhắn', data.tongTinNhan);
    y3 += dongHeight;
    veDongThongTin(x3, y3, 'Hôm nay', data.homNay);
    y3 += dongHeight;
    veDongThongTin(x3, y3, 'Hôm qua', data.homQua);
    
    const adminPanelY = contentY + chieuCaoPanel + 30;
    const danhSachQTV = data.danhSachQTV.split('\n').filter(Boolean).map(name => name.replace(/• /g, ''));
    
    ctx.font = '32px "Signika-SemiBold"';
    const soDongQTV = Math.ceil(danhSachQTV.length / 2);
    let maxCol1Width = 0, maxCol2Width = 0;
    for (let i = 0; i < soDongQTV; i++) {
        if (danhSachQTV[i]) maxCol1Width = Math.max(maxCol1Width, ctx.measureText(danhSachQTV[i]).width);
        if (danhSachQTV[i + soDongQTV]) maxCol2Width = Math.max(maxCol2Width, ctx.measureText(danhSachQTV[i + soDongQTV]).width);
    }
    
    const tieuDeQTV = `Danh Sách ${data.soQTV} Quản Trị Viên`;
    ctx.font = 'bold 40px "Signika-SemiBold"';
    const titleWidth = ctx.measureText(tieuDeQTV).width;
    
    const adminPanelPadding = 40;
    const columnGap = 50;
    let chieuRongPanelQTV = adminPanelPadding * 2 + maxCol1Width + (maxCol2Width > 0 ? columnGap + maxCol2Width : 0);
    chieuRongPanelQTV = Math.max(chieuRongPanelQTV, titleWidth + adminPanelPadding * 2);

    const adminLineHeight = 50;
    let chieuCaoPanelQTV = 100 + (soDongQTV * adminLineHeight) + 20;
    if (chieuCaoPanelQTV < 220) chieuCaoPanelQTV = 220;
    
    const adminPanelX = (chieuRong - chieuRongPanelQTV) / 2;
    veKhungKinhMo(adminPanelX, adminPanelY, chieuRongPanelQTV, chieuCaoPanelQTV);
    
    ctx.font = 'bold 40px "Signika-SemiBold"';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(tieuDeQTV, adminPanelX + chieuRongPanelQTV / 2, adminPanelY + 60);
    
    ctx.font = '32px "Signika-SemiBold"';
    ctx.textAlign = 'left';
    let yAdmin = adminPanelY + 120;
    for (let i = 0; i < soDongQTV; i++) {
        if (danhSachQTV[i]) ctx.fillText(danhSachQTV[i], adminPanelX + adminPanelPadding, yAdmin + (i * adminLineHeight));
        if (danhSachQTV[i + soDongQTV]) ctx.fillText(danhSachQTV[i + soDongQTV], adminPanelX + adminPanelPadding + maxCol1Width + columnGap, yAdmin + (i * adminLineHeight));
    }

    ctx.font = 'italic 25px "Signika-SemiBold"';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(`Thời gian: ${data.thoiGianHienTai} - PCODER`, chieuRong / 2, chieuCao - 30);
    
    ctx.textAlign = 'right';
    ctx.fillText("Created by Nguyễn Trương Thiện Phát (Pcoder)", chieuRong - 30, chieuCao - 30);

    return canvas.toBuffer('image/png');
}

//================================================================================//
//                           MODULE CONFIG VÀ HANDLE EVENT                         //
//================================================================================//
const duongDanThongKe = path.join(__dirname, "cache", "totalChat.json");
const _24HOURS = 86400000;

module.exports.config = {
    name: "boxinfo",
    version: "4.0.0",
    hasPermssion: 0,
    credits: "Pcoder",
    description: "Xem thông tin box của bạn với bố cục được Việt hóa.",
    commandCategory: "Nhóm",
    usages: "",
    cooldowns: 10,
    dependencies: {
        "canvas": "", "axios": "", "fs-extra": "", "path": "", "moment-timezone": ""
    }
};

module.exports.handleEvent = async ({ api, event }) => {
    if (!fs.existsSync(duongDanThongKe)) fs.outputFileSync(duongDanThongKe, JSON.stringify({}));
    let totalChat = JSON.parse(fs.readFileSync(duongDanThongKe));
    if (!totalChat[event.threadID]) return;
    if (Date.now() - totalChat[event.threadID].time > (_24HOURS * 2)) {
        let sl = (await api.getThreadInfo(event.threadID)).messageCount;
        totalChat[event.threadID] = {
            time: Date.now() - _24HOURS,
            count: sl,
            ytd: sl - totalChat[event.threadID].count
        };
        fs.writeFileSync(duongDanThongKe, JSON.stringify(totalChat, null, 2));
    }
};

//================================================================================//
//                                  HÀM RUN CHÍNH                                  //
//================================================================================//

module.exports.run = async ({ api, event, Threads, Users }) => {
    const { threadID, messageID } = event;
    const duongDanAnh = path.join(__dirname, `cache/boxinfo_${threadID}.png`);

    try {
        api.setMessageReaction("⏳", messageID, (err) => {}, true);

        const thongTinNhom = await Threads.getInfo(threadID);
        const duLieuNhom = (await Threads.getData(threadID)).threadInfo;

        const soNam = thongTinNhom.userInfo.filter(u => u.gender == "MALE").length;
        const soNu = thongTinNhom.userInfo.filter(u => u.gender == "FEMALE").length;

        const danhSachIdQTV = duLieuNhom.adminIDs || thongTinNhom.adminIDs || [];
        let danhSachQTV = "";
        for (const id of danhSachIdQTV) {
            const thongTinQTV = await Users.getInfo(id.id);
            danhSachQTV += `• ${thongTinQTV.name}\n`;
        }

        const pheDuyet = (thongTinNhom.approvalMode ?? duLieuNhom.approvalMode) ? "bật" : "tắt";

        if (!fs.existsSync(duongDanThongKe)) fs.outputFileSync(duongDanThongKe, JSON.stringify({}));
        let totalChat = JSON.parse(fs.readFileSync(duongDanThongKe));
        if (!totalChat[threadID]) {
            totalChat[threadID] = { time: Date.now(), count: thongTinNhom.messageCount, ytd: 0 };
            fs.writeFileSync(duongDanThongKe, JSON.stringify(totalChat, null, 2));
        }

        let mdtt = "Chưa có thống kê";
        const soTinNhanTruoc = totalChat[threadID].count || 0;
        const soTinNhanHomQua = totalChat[threadID].ytd || 0;
        const soTinNhanHomNay = (soTinNhanHomQua != 0) ? (thongTinNhom.messageCount - soTinNhanTruoc) : "Chưa có thống kê";
        const homQua = (soTinNhanHomQua != 0) ? soTinNhanHomQua : "Chưa có thống kê";

        const timeByMS = Date.now();
        if (timeByMS - totalChat[threadID].time > _24HOURS) {
            if (timeByMS - totalChat[threadID].time > (_24HOURS * 2)) {
                totalChat[threadID] = { count: thongTinNhom.messageCount, time: timeByMS - _24HOURS, ytd: thongTinNhom.messageCount - soTinNhanTruoc };
                fs.writeFileSync(duongDanThongKe, JSON.stringify(totalChat, null, 2));
            }
            const soGio = Math.ceil((timeByMS - totalChat[threadID].time - _24HOURS) / 3600000);
            if (soTinNhanHomQua > 0) mdtt = `${((soTinNhanHomNay / (soTinNhanHomQua / 24 * soGio)) * 100).toFixed(0)}%`;
        }
        
        const duLieu = {
            tenNhom: duLieuNhom.threadName || thongTinNhom.threadName || "Không tên",
            idNhom: thongTinNhom.threadID,
            pheDuyet,
            tongThanhVien: thongTinNhom.participantIDs.length,
            soNam,
            soNu,
            soQTV: danhSachIdQTV.length,
            danhSachQTV,
            tongTinNhan: thongTinNhom.messageCount.toLocaleString(),
            homNay: soTinNhanHomNay.toLocaleString(),
            homQua: homQua.toLocaleString(),
            thoiGianHienTai: moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss - DD/MM/YYYY"),
            anhAvatar: thongTinNhom.imageSrc
        };

        const bufferAnh = await taoAnhThongTinNhom(duLieu);
        fs.writeFileSync(duongDanAnh, bufferAnh);

        api.setMessageReaction("✅", messageID, (err) => {}, true);

        return api.sendMessage({
            attachment: fs.createReadStream(duongDanAnh)
        }, threadID, () => fs.unlinkSync(duongDanAnh), messageID);

    } catch (e) {
        console.error("Lỗi trong boxinfo:", e);
        api.sendMessage("Đã xảy ra lỗi khi tạo ảnh thông tin nhóm. Vui lòng thử lại sau.", threadID, messageID);
    }
};
