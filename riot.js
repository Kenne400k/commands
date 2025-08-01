const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const { riotApiKey } = require("./apiriot.js");

async function getAssetBuffer(url) {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(res.data, 'binary');
    } catch (e) {
        console.error(`Lỗi khi tải asset từ ${url}:`, e.message);
        const canvas = createCanvas(1, 1);
        return canvas.toBuffer();
    }
}

(async () => {
    const cacheDir = path.join(__dirname, '../../cache');
    await fs.ensureDir(cacheDir);

    const fontUrls = [
        { url: 'https://github.com/google/fonts/raw/main/ofl/bevietnampro/BeVietnamPro-Bold.ttf', filename: 'BeVietnamPro-Bold.ttf' },
        { url: 'https://github.com/google/fonts/raw/main/ofl/bevietnampro/BeVietnamPro-Regular.ttf', filename: 'BeVietnamPro-Regular.ttf' }
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
        if (!fs.existsSync(localPath)) try {
            const res = await axios({ method: 'GET', url: font.url, responseType: 'stream' });
            res.data.pipe(fs.createWriteStream(localPath));
        } catch (e) { console.error(`Lỗi tải font ${font.filename}:`, e.message); }
    }
    
    try {
        registerFont(path.join(cacheDir, 'BeVietnamPro-Bold.ttf'), { family: "BeVietnamPro", weight: "bold"});
        registerFont(path.join(cacheDir, 'BeVietnamPro-Regular.ttf'), { family: "BeVietnamPro", weight: "regular"});
    } catch (e) { console.error("Lỗi đăng ký font.", e); }

    for (let i = 0; i < backgroundUrls.length; i++) {
        const localPath = path.join(cacheDir, `bg_riot_${i}.jpg`);
        if (!fs.existsSync(localPath)) try {
            const res = await axios({ method: 'GET', url: backgroundUrls[i], responseType: 'arraybuffer' });
            fs.writeFileSync(localPath, res.data);
        } catch (e) { console.error(`Lỗi tải background:`, e.message); }
    }
})();

async function createRiotInfoImage({ avatarUrl, nameTag, soloQ, flexQ, tftRank, masteryScore, challengeLevel, topChampsData }) {
    const width = 1200, height = 675;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const cacheDir = path.join(__dirname, '../../cache');
    try {
        const bgFiles = fs.readdirSync(cacheDir).filter(f => f.startsWith('bg_riot_'));
        const randomBgPath = path.join(cacheDir, bgFiles[Math.floor(Math.random() * bgFiles.length)]);
        const bgImage = await loadImage(randomBgPath);
        ctx.drawImage(bgImage, 0, 0, width, height);
    } catch (e) {
        ctx.fillStyle = '#0a101b'; ctx.fillRect(0, 0, width, height);
    }
    ctx.fillStyle = "rgba(10, 16, 27, 0.9)";
    ctx.fillRect(0, 0, width, height);

    const titleColor = "#59bfff";
    const whiteColor = "#f0f0f0";
    const grayColor = "#a0a0a0";
    
    const leftColumnX = 300;
    
    const avatarSize = 160;
    const avatarY = 180;
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        ctx.lineTo(leftColumnX + avatarSize/2 * Math.cos(i * 2 * Math.PI / 6), avatarY + avatarSize/2 * Math.sin(i * 2 * Math.PI / 6));
    }
    ctx.closePath();
    ctx.strokeStyle = titleColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = titleColor;
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.clip();
    const avatar = await loadImage(await getAssetBuffer(avatarUrl));
    ctx.drawImage(avatar, leftColumnX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.font = `bold 42px "BeVietnamPro"`;
    ctx.fillStyle = whiteColor;
    ctx.shadowColor = whiteColor;
    ctx.shadowBlur = 10;
    ctx.fillText(nameTag, leftColumnX, avatarY + avatarSize/2 + 65);
    ctx.shadowColor = 'transparent';

    ctx.font = `regular 24px "BeVietnamPro"`;
    ctx.fillStyle = grayColor;
    ctx.fillText(`Mastery: ${masteryScore.toLocaleString()} pts`, leftColumnX, avatarY + avatarSize/2 + 110);
    ctx.fillText(`Challenge Level: ${challengeLevel}`, leftColumnX, avatarY + avatarSize/2 + 145);

    const rightColumnX = 620;
    let currentY = 100;
    
    function drawStatBlock(title, rankData) {
        ctx.textAlign = 'left';
        ctx.font = `bold 24px "BeVietnamPro"`;
        ctx.fillStyle = titleColor;
        ctx.shadowColor = titleColor;
        ctx.shadowBlur = 10;
        ctx.fillText(title, rightColumnX, currentY);
        ctx.shadowColor = 'transparent';
        
        currentY += 40;
        
        ctx.font = `bold 26px "BeVietnamPro"`;
        ctx.fillStyle = whiteColor;
        if (rankData) {
            ctx.fillText(`${rankData.tier.toUpperCase()} ${rankData.rank}`, rightColumnX, currentY);
            
            const winrate = rankData.wins + rankData.losses > 0 ? (rankData.wins / (rankData.wins + rankData.losses) * 100).toFixed(1) : 0;
            currentY += 30;
            ctx.font = `regular 20px "BeVietnamPro"`;
            ctx.fillStyle = grayColor;
            ctx.fillText(`${rankData.leaguePoints} LP / ${rankData.wins}W ${rankData.losses}L (${winrate}%)`, rightColumnX, currentY);
        } else {
            ctx.fillText("Chưa xếp hạng", rightColumnX, currentY);
        }
        currentY += 80;
    }

    drawStatBlock("Xếp Hạng Đơn/Đôi", soloQ);
    drawStatBlock("Xếp Hạng Linh Hoạt", flexQ);
    drawStatBlock("Đấu Trường Chân Lý", tftRank);

    ctx.textAlign = 'left';
    ctx.font = `bold 24px "BeVietnamPro"`;
    ctx.fillStyle = titleColor;
    ctx.shadowColor = titleColor;
    ctx.shadowBlur = 10;
    ctx.fillText("Tướng Thông Thạo Nhất", rightColumnX, currentY);
    ctx.shadowColor = 'transparent';
    
    currentY += 30;
    const champBoxSize = 70;
    const champSpacing = 20;
    for (let i = 0; i < topChampsData.length; i++) {
        const champ = topChampsData[i];
        const champIconUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champ.championId}.png`;
        const champIcon = await loadImage(await getAssetBuffer(champIconUrl));
        
        const currentChampX = rightColumnX + i * (champBoxSize + champSpacing);
        ctx.drawImage(champIcon, currentChampX, currentY, champBoxSize, champBoxSize);
        
        ctx.textAlign = 'center';
        ctx.font = `bold 18px "BeVietnamPro"`;
        ctx.fillStyle = whiteColor;
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 5;
        ctx.fillText(`Lv.${champ.championLevel}`, currentChampX + champBoxSize / 2, currentY + champBoxSize + 20);
        ctx.shadowColor = 'transparent';
    }
    
    return canvas.toBuffer('image/png');
}

module.exports.config = {
    name: "riot",
    version: "7.0.0",
    hasPermssion: 0,
    credits: "nvh & Pcoder",
    description: "Lấy thông tin Riot ID với giao diện theo mẫu.",
    commandCategory: "game",
    usages: "[gameName]#[tagLine]",
    cooldowns: 15
};

module.exports.run = async function ({ api, event, args }) {
    try {
        if (!args[0] || !args.join(" ").includes("#")) {
            return api.sendMessage("⚠️ Vui lòng nhập Riot ID theo định dạng: Tên#Tag", event.threadID, event.messageID);
        }

        const waitingMessage = await api.sendMessage("🔍 Đang tìm kiếm và tạo ảnh, vui lòng chờ trong giây lát...", event.threadID);

        const input = args.join(" ").trim();
        const idx = input.lastIndexOf("#");
        const gameName = input.slice(0, idx).trim();
        const tagLine = input.slice(idx + 1).trim();

        const apiKey = riotApiKey;
        const headers = { "User-Agent": "Mozilla/5.0", "Accept-Language": "vi-VN,vi;q=0.9", "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8" };

        const accountRes = await axios.get(`https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${apiKey}`, { headers });
        const { puuid, gameName: name, tagLine: tag } = accountRes.data;
        
        const summonerRes = await axios.get(`https://vn2.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${apiKey}`, { headers });
        const profileIconId = summonerRes.data.profileIconId;
        const avatarUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${profileIconId}.jpg`;

        const rankRes = await axios.get(`https://vn2.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${apiKey}`, { headers });
        const soloQ = rankRes.data.find(x => x.queueType === "RANKED_SOLO_5x5");
        const flexQ = rankRes.data.find(x => x.queueType === "RANKED_FLEX_SR");

        const masteryScore = (await axios.get(`https://vn2.api.riotgames.com/lol/champion-mastery/v4/scores/by-puuid/${puuid}?api_key=${apiKey}`, { headers })).data;
        const topChampsData = (await axios.get(`https://vn2.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=3&api_key=${apiKey}`, { headers })).data;
        
        const challengeLevel = (await axios.get(`https://vn2.api.riotgames.com/lol/challenges/v1/player-data/${puuid}?api_key=${apiKey}`, { headers })).data.totalPoints?.level || "Không rõ";

        let tftRank = null;
        try {
            tftRank = (await axios.get(`https://vn2.api.riotgames.com/tft/league/v1/entries/by-puuid/${puuid}?api_key=${apiKey}`, { headers })).data.find(x => x.queueType === "RANKED_TFT");
        } catch {}
        
        const imageBuffer = await createRiotInfoImage({
             avatarUrl,
             nameTag: `${name}#${tag}`,
             soloQ, flexQ, tftRank, masteryScore, challengeLevel, topChampsData
         });

        const tempPath = path.join(__dirname, '../../cache', `riot_${puuid}.png`);
        fs.writeFileSync(tempPath, imageBuffer);
        
        api.unsendMessage(waitingMessage.messageID);
        return api.sendMessage({ attachment: fs.createReadStream(tempPath) }, event.threadID, () => fs.unlinkSync(tempPath), event.messageID);

    } catch (err) {
        console.error("Lỗi ở lệnh riot:", err.response ? err.response.data : err.message);
        return api.sendMessage("❌ Không tìm thấy người chơi này hoặc đã có lỗi xảy ra. Vui lòng kiểm tra lại Riot ID và API Key.", event.threadID, event.messageID);
    }
};
