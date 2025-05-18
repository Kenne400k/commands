//xin lưu ý , đây là lệnh có sử dụng canvas , cho nên hãy cài package canvas về
// npm i canvas
// xin vui lòng không đổi credits giúp mình
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const Fuse = require('fuse.js');

module.exports.config = {
    name: "banking",
    version: "1.8.0",
    hasPermssion: 2,
    credits: "Pcoder",
    description: "Tạo mã QR Ngân Hàng",
    commandCategory: "tiện ích",
    usages: "/banking <tên ngân hàng gần đúng> <STK> <Số tiền> [nội dung chuyển khoản]",
    cooldowns: 5
};


module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const [bankInput, phoneNumber, amount, ...contentArr] = args;
    const content = contentArr.join(" ") || "Chuyen khoan";

    if (!bankInput || !phoneNumber || !amount) {
        return api.sendMessage("⚠️ Vui lòng nhập đúng định dạng: /banking <Tên ngân hàng> <STK> <Số tiền> [Nội dung]\nvd: /banking Mbbank 212232222 150000 filebot", threadID, messageID);
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return api.sendMessage("⚠️ Số tiền không hợp lệ. Vui lòng nhập một số dương vd: 200000", threadID, messageID);
    }

    let banksData;
    try {
        const res = await axios.get('https://api.vietqr.io/v2/banks');
        banksData = res.data.data;
        if (!banksData || banksData.length === 0) {
            return api.sendMessage("❌ Không thể lấy được danh sách ngân hàng hoặc danh sách trống.", threadID, messageID);
        }
    } catch (error) {
        console.error("Lỗi lấy danh sách ngân hàng:", error);
        return api.sendMessage("❌ Đã xảy ra lỗi khi cố gắng lấy danh sách ngân hàng. Vui lòng thử lại sau.", threadID, messageID);
    }

    let matchedBank = null;
    if (banksData && banksData.length > 0) {
        const fuseOptions = {
            includeScore: true,
            shouldSort: true,
            threshold: 0.4,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: [
                { name: 'name', weight: 0.4 },
                { name: 'shortName', weight: 0.4 },
                { name: 'code', weight: 0.2 }
            ]
        };
        const fuse = new Fuse(banksData, fuseOptions);
        const searchResults = fuse.search(bankInput.trim());

        if (searchResults.length > 0) {
            if (searchResults[0].score < 0.45) {
                matchedBank = searchResults[0].item;
            } else {
                const normalize = s => (s || '').toLowerCase().replace(/\s/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
                const inputNorm = normalize(bankInput);
                matchedBank = banksData.find(b =>
                    normalize(b.shortName).includes(inputNorm) ||
                    normalize(b.name).includes(inputNorm) ||
                    (b.code && normalize(b.code).includes(inputNorm)) ||
                    (b.bin && normalize(b.bin).includes(inputNorm))
                );
            }
        }
    }

    if (!matchedBank) {
        let suggestion = "";
        if (banksData && banksData.length > 0) {
            const fuse = new Fuse(banksData, { keys: ['name', 'shortName'], threshold: 0.6 });
            const suggestions = fuse.search(bankInput.trim()).slice(0, 3).map(r => `${r.item.shortName} (${r.item.name})`);
            if (suggestions.length > 0) {
                suggestion = "\nCó phải bạn muốn tìm: \n- " + suggestions.join("\n- ");
            } else if (banksData.length > 0) {
                suggestion = "\nMột số ngân hàng có sẵn: \n- " + banksData.slice(0,3).map(b => `${b.shortName} (${b.name})`).join("\n- ");
            }
        }
        return api.sendMessage(`❌ Không tìm thấy ngân hàng nào khớp với "${bankInput}". ${suggestion}`, threadID, messageID);
    }

    if (!matchedBank.bin) {
        console.error(`Ngân hàng ${matchedBank.shortName} (code: ${matchedBank.code}) không có thông tin 'bin'.`);
        return api.sendMessage(`❌ Ngân hàng ${matchedBank.shortName} không có đủ thông tin (mã BIN) để tạo QR. Vui lòng thử ngân hàng khác.`, threadID, messageID);
    }

    const qrUrl = `https://img.vietqr.io/image/${matchedBank.bin}-${phoneNumber}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(matchedBank.shortName)}`;

    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const timestamp = Date.now();
    const qrPath = path.join(cacheDir, `${phoneNumber}_${timestamp}_qr.png`);
    const logoPath = path.join(cacheDir, `${matchedBank.code}_${timestamp}_logo.png`);
    const outputPath = path.join(cacheDir, `${phoneNumber}_${timestamp}_banking.png`);

    const download = async (url, dest) => {
        try {
            const response = await axios({ url, method: 'GET', responseType: 'stream' });
            return new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(dest);
                response.data.pipe(writer);
                writer.on('finish', resolve);
                writer.on('error', (err) => reject(new Error(`Lỗi tải ${path.basename(dest)} từ ${url}: ${err.message}`)));
            });
        } catch (error) {
            console.error(`Lỗi axios khi tải ${url}:`, error.message);
            throw error;
        }
    };

    try {
        await download(qrUrl, qrPath);
        if (matchedBank.logo) {
            await download(matchedBank.logo, logoPath);
        } else {
            console.warn(`Ngân hàng ${matchedBank.shortName} không có URL logo.`);
            const placeholderCanvas = createCanvas(200, 80);
            const placeholderCtx = placeholderCanvas.getContext('2d');
            placeholderCtx.fillStyle = '#555';
            placeholderCtx.fillRect(0, 0, 200, 80);
            placeholderCtx.fillStyle = '#fff';
            placeholderCtx.font = 'bold 20px monospace';
            placeholderCtx.textAlign = 'center';
            placeholderCtx.textBaseline = 'middle';
            placeholderCtx.fillText(matchedBank.shortName, 100, 40);
            fs.writeFileSync(logoPath, placeholderCanvas.toBuffer('image/png'));
        }

        const width = 720;
        const height = 900;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, '#2E3138');
        bgGradient.addColorStop(0.5, '#22252A');
        bgGradient.addColorStop(1, '#1C1E22');

        ctx.fillStyle = bgGradient;
        roundRect(ctx, 0, 0, width, height, 15);
        ctx.fill();

        const textColor = '#D1D5DB';
        const accentColor1 = '#60A5FA';
        const accentColor2 = '#A78BFA';
        const fontBase = 'monospace';

        const headerHeight = 45;
        const headerColor = 'rgba(23, 24, 28, 0.7)';
        ctx.fillStyle = headerColor;
        roundRect(ctx, 0, 0, width, headerHeight, { tl: 15, tr: 15, br: 0, bl: 0 });
        ctx.fill();

        const btnRadius = 8;
        const btnY = headerHeight / 2;
        const btnColors = ['#ff5f57', '#febb2e', '#28c840'];
        const btnXStart = 20;

        btnColors.forEach((color, i) => {
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(btnXStart + i * (btnRadius * 2 + 8), btnY, btnRadius, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = textColor;
        ctx.font = `bold 16px ${fontBase}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR PAYMENT', width / 2, headerHeight / 2);

        let logoImg;
        try {
            logoImg = await loadImage(logoPath);
        } catch (e) {
            console.error("Lỗi load logo:", e);
            const placeholderCanvas = createCanvas(150, 60);
            const placeholderCtx = placeholderCanvas.getContext('2d');
            placeholderCtx.fillStyle = '#444852';
            placeholderCtx.fillRect(0, 0, 150, 60);
            placeholderCtx.fillStyle = '#fff';
            placeholderCtx.font = `bold 16px ${fontBase}`;
            placeholderCtx.textAlign = 'center';
            placeholderCtx.textBaseline = 'middle';
            placeholderCtx.fillText(matchedBank.shortName, 75, 30);
            logoImg = await loadImage(placeholderCanvas.toBuffer('image/png'));
        }

        const logoAreaX = 40;
        const logoAreaY = headerHeight + 25;
        const maxLogoHeight = 55;
        const maxLogoWidth = 180;
        
        let displayLogoWidth = logoImg.width;
        let displayLogoHeight = logoImg.height;
        const aspectRatio = logoImg.width / logoImg.height;

        if (displayLogoHeight > maxLogoHeight) {
            displayLogoHeight = maxLogoHeight;
            displayLogoWidth = displayLogoHeight * aspectRatio;
        }
        if (displayLogoWidth > maxLogoWidth) {
            displayLogoWidth = maxLogoWidth;
            displayLogoHeight = displayLogoWidth / aspectRatio;
        }

        const logoActualY = logoAreaY + (maxLogoHeight - displayLogoHeight) / 2;
        ctx.drawImage(logoImg, logoAreaX, logoActualY, displayLogoWidth, displayLogoHeight);

        ctx.fillStyle = accentColor2;
        ctx.font = `bold 22px ${fontBase}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const bankNameX = logoAreaX + displayLogoWidth + 20;
        const bankNameY = logoAreaY + maxLogoHeight / 2;
        const maxBankNameWidth = width - bankNameX - 30;
        ctx.fillText(truncateText(matchedBank.shortName.toUpperCase(), maxBankNameWidth, ctx), bankNameX, bankNameY);


        const qrImg = await loadImage(qrPath);
        const qrContainerSize = 300;
        const qrPadding = 15;
        const qrActualSize = qrContainerSize - 2 * qrPadding;
        const qrContainerX = (width - qrContainerSize) / 2;
        
        const qrContainerY = logoAreaY + maxLogoHeight + 45;


        ctx.fillStyle = '#ffffff'; 
        roundRect(ctx, qrContainerX, qrContainerY, qrContainerSize, qrContainerSize, 10);
        ctx.fill();
        ctx.drawImage(qrImg, qrContainerX + qrPadding, qrContainerY + qrPadding, qrActualSize, qrActualSize);

        ctx.strokeStyle = accentColor1;
        ctx.lineWidth = 2;
        roundRect(ctx, qrContainerX, qrContainerY, qrContainerSize, qrContainerSize, 10);
        ctx.stroke();

        let currentY = qrContainerY + qrContainerSize + 50;
        const lineStartX = 50;
        const lineHeight = 32; 
        const keyColor = accentColor1;
        const valueColor = textColor;
        const valueKeySpacing = 10;

        function drawInfoLine(key, value, keyFont = `bold 18px ${fontBase}`, valueFont = `18px ${fontBase}`) {
            if (currentY + lineHeight > height - 30) return;
        
            ctx.font = keyFont;
            ctx.fillStyle = keyColor;
            ctx.textAlign = 'left';
            const keyText = `${key}`;
            ctx.fillText(keyText, lineStartX, currentY);
        
            ctx.font = valueFont;
            ctx.fillStyle = valueColor;
            const keyWidth = ctx.measureText(keyText).width;
            let valueMaxWidth = width - (lineStartX + keyWidth + valueKeySpacing) - lineStartX;
            
            let lines = getWrappedText(value, valueMaxWidth, ctx, valueFont);
            lines.forEach((line, index) => {
                if (index > 0) {
                    
                    if (currentY + lineHeight > height - 30) return;
                    currentY += (lineHeight * 0.85); 
                }
                ctx.fillText(line, lineStartX + keyWidth + valueKeySpacing, currentY);
            });
            
            if (currentY + lineHeight <= height - 30) {
                currentY += lineHeight;
            } else {
                currentY = height; 
            }
        }

        const formattedAmount = parseFloat(amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

        drawInfoLine('[Bank]      :', `${matchedBank.name} (${matchedBank.shortName})`);
        drawInfoLine('[Account]   :', phoneNumber);
        drawInfoLine('[Amount]    :', formattedAmount);
        
        const displayContent = content.length > 100 ? content.substring(0, 97) + "..." : content;
        drawInfoLine('[Content]   :', displayContent);
        drawInfoLine('[Recipient] :', matchedBank.shortName);

        if (currentY < height - 50) { 
            currentY += lineHeight * 0.3;
            ctx.font = `14px ${fontBase}`;
            ctx.fillStyle = '#888B92'; 
            ctx.textAlign = 'center';
            ctx.fillText(`Quét mã để thanh toán cho ${matchedBank.shortName}`, width / 2, currentY);
            currentY += 20;
            if (currentY < height - 25) {
                 ctx.fillText(`Generated: ${new Date().toLocaleString('vi-VN')}`, width / 2, currentY);
            }
        }


        const out = fs.createWriteStream(outputPath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        out.on('finish', () => {
            api.sendMessage({
                body: `✅ QR cho ${matchedBank.shortName}:\n- STK: ${phoneNumber}\n- Tiền: ${formattedAmount}\n- ND: ${content}`,
                attachment: fs.createReadStream(outputPath)
            }, threadID, () => {
                
                
                
            }, messageID);
        });

    } catch (error) {
        console.error("Lỗi trong quá trình tạo ảnh QR Banking:", error);
        let errorMessage = "❌ Đã xảy ra lỗi khi tạo ảnh QR banking.";
        if (error.message && error.message.includes("Lỗi tải")) {
            errorMessage = `❌ Lỗi tải tài nguyên: ${error.message}. Vui lòng kiểm tra kết nối mạng và thử lại.`;
        } else if (error.response && error.response.status === 404 && error.config && error.config.url.includes('vietqr.io/image')) {
            errorMessage = `❌ Lỗi khi tạo mã QR từ VietQR: Không tìm thấy thông tin cho STK ${phoneNumber} tại ${matchedBank ? matchedBank.shortName : 'ngân hàng đã chọn'}. Vui lòng kiểm tra lại STK và ngân hàng.`;
        }
        return api.sendMessage(errorMessage, threadID, messageID);
    }
};

function truncateText(text, maxWidth, context) {
    let width = context.measureText(text).width;
    const ellipsis = "...";
    const ellipsisWidth = context.measureText(ellipsis).width;
    if (width <= maxWidth) {
        return text;
    }
    while (width + ellipsisWidth > maxWidth && text.length > 0) {
        text = text.substring(0, text.length - 1);
        width = context.measureText(text).width;
    }
    return text + ellipsis;
}

function getWrappedText(text, maxWidth, context, font) {
    const words = String(text).split(' '); 
    let lines = [];
    let currentLine = words[0] || ""; 
    context.font = font;

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + " " + word;
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth < maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}


function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (let side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
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
}
