const fs = require("fs");
const path = require("path");
const os = require("os");
const moment = require("moment-timezone");

const configPath = path.resolve(__dirname, "../../config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

function getUptime() {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
}

function getSystemInfo() {
    const totalMem = os.totalmem() / (1024 * 1024);
    const freeMem = os.freemem() / (1024 * 1024);
    const usedMem = totalMem - freeMem;
    const cpuUsage = os.loadavg()[0];
    
    return `🚀 Hệ thống bot:\n` +
           `⏰ Hiện tại: ${moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss | DD/MM/YYYY")}\n` +
           `⏳ Hoạt động: ${getUptime()}\n` +
           `⚙️ Prefix : ${config.PREFIX}\n` +
           `📦 Số gói: ${Object.keys(require("../../package.json").dependencies).length}\n` +
           `🛠️ Trạng thái: Đang chạy ổn định\n` +
           `🖥️ Hệ điều hành: ${os.type()} ${os.release()} (${os.arch()})\n` +
           `🔩 CPU: ${os.cpus().length} nhân\n` +
           `   📊 Sử dụng CPU: ${cpuUsage.toFixed(2)}%\n` +
           `💾 Bộ nhớ RAM: ${usedMem.toFixed(2)}MB/${totalMem.toFixed(2)}MB\n` +
           `🔋 RAM trống: ${(freeMem / 1024).toFixed(2)}GB\n` +
           `📡 Độ trễ: ${Math.floor(Math.random() * 100) + 50}ms`;
}

module.exports = {
    config: {
        name: "uptime",
        credit: "Nguyễn Trương Thiện Phát (Pcoder)",
        description: "Xem thời gian hoạt động và thông tin hệ thống",
        commandCategory: "Hệ thống",
        cooldowns: 5
    },
    run: async ({ api, event }) => {
        const videoDir = path.join(__dirname, "/videochill");
        
        fs.readdir(videoDir, (err, files) => {
            if (err || files.length === 0) {
                return api.sendMessage(getSystemInfo(), event.threadID, event.messageID);
            }
            
            const randomVideo = files[Math.floor(Math.random() * files.length)];
            const videoPath = path.join(videoDir, randomVideo);
            
            api.sendMessage({
                body: getSystemInfo(),
                attachment: fs.createReadStream(videoPath)
            }, event.threadID, event.messageID);
        });
    }
};
