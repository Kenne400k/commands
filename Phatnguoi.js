const fs = require('fs');
const path = require('path');

// Mã hóa giá trị expectedCredits
const expectedCredits = "Nguyễn Trương Thiện Phát (Pcoder)";

// Kiểm tra và lưu giá trị expectedCredits vào tệp
const creditsFilePath = path.join(__dirname, 'credits_config.json');

// Đọc giá trị credits từ file (nếu có)
function loadExpectedCredits() {
    if (fs.existsSync(creditsFilePath)) {
        const data = fs.readFileSync(creditsFilePath, 'utf8');
        return JSON.parse(data).credits;
    }
    return null;
}

// Lưu giá trị credits vào file
function saveExpectedCredits() {
    const data = { credits: expectedCredits };
    fs.writeFileSync(creditsFilePath, JSON.stringify(data), 'utf8');
}

// Kiểm tra phần trên - kiểm tra "credits"
function checkCredits() {
    const currentCredits = loadExpectedCredits();
    if (currentCredits !== expectedCredits) {
        console.log(`⚠️ Địt Mẹ Mày, ai cho mày đổi credits ?????`);
        console.log(`Vui lòng kiểm tra và sửa lại giá trị "credits" trong tệp.`);
        
        // Lấy thông tin file hiện tại
        const currentFileName = __filename;
        const currentLine = 19; // Dòng mà bạn muốn thông báo nếu có sự thay đổi (chỉnh lại số dòng tương ứng)
        console.log(`Sửa lại giá trị "credits" tại dòng: ${currentLine} trong file ${currentFileName}`);
        
        process.exit(1); // Dừng chương trình
    }
}

// Kiểm tra phần dưới - Kiểm tra "config" (hoặc các phần khác bạn muốn)
function checkConfig() {
    // Đảm bảo rằng config có chứa giá trị đúng
    if (module.exports.config.credits !== expectedCredits) {
        console.log("⚠️ Giá trị 'credits' trong config đã bị thay đổi!");
        console.log("Vui lòng sửa lại giá trị 'credits' trong module.exports.config.");
        
        process.exit(1); // Dừng chương trình
    }
}

// Nếu tệp credits_config.json không tồn tại, tạo mới
if (loadExpectedCredits() === null) {
    saveExpectedCredits();
}

// Kiểm tra phần trên
checkCredits();

// Kiểm tra phần dưới
checkConfig();

// Định nghĩa config module
module.exports.config = {
    name: "phatnguoi",
    version: "1.0.1",
    hasPermission: 0,
    credits: expectedCredits,  // Lệnh này sẽ được kiểm tra, nếu bị thay đổi thì dừng
    description: "Kiểm tra phạt nguội xe máy, ô tô, xe máy điện",
    commandCategory: "Tiện ích",
    usages: "[Biển số xe]",
    cooldowns: 5,
};

// Đoạn mã kiểm tra các lệnh

module.exports.run = async function ({ api, event, args }) {
    const bienSo = args.join("").toUpperCase();

    if (!bienSo) {
        return api.sendMessage("⚠️ Vui lòng nhập biển số xe cần kiểm tra. VD : /phatnguoi 72A12345", event.threadID, event.messageID);
    }

    try {
        const response = await axios.post("https://api.checkphatnguoi.vn/phatnguoi", { bienso: bienSo }, {
            headers: { "Content-Type": "application/json" }
        });

        const { status, data, data_info } = response.data;

        if (status === 1 && data.length > 0) {
            let message = `🚨 *Kết quả kiểm tra phạt nguội cho biển số: **${bienSo}**\n`;
            message += `📊 Tổng số vi phạm: ${data_info.total}\n`;
            message += `❌ Chưa xử phạt: ${data_info.chuaxuphat} | ✅ Đã xử phạt: ${data_info.daxuphat}\n`;
            message += `⏰ Lần vi phạm gần nhất: ${data_info.latest || "Không có lỗi"}\n\n`;

            data.forEach((violation, index) => {
                message += `🚔 *Vi phạm ${index + 1}:*\n`;
                message += `📅 *Thời gian:* ${violation["Thời gian vi phạm"] || "Không có lỗi"}\n`;
                message += `📍 *Địa điểm:* ${violation["Địa điểm vi phạm"] || "Không có lỗi"}\n`;
                message += `⚠️ *Lỗi vi phạm:* ${violation["Hành vi vi phạm"] || "Không có lỗi"}\n`;
                message += `📌 *Trạng thái:* ${violation["Trạng thái"] || "Không có lỗi"}\n`;
                message += `🚓 *Đơn vị phát hiện:* ${violation["Đơn vị phát hiện vi phạm"] || "Không có lỗi"}\n\n`;

                message += `📌 *Nơi giải quyết vụ việc:*\n`;
                if (violation["Nơi giải quyết vụ việc"] && violation["Nơi giải quyết vụ việc"].length > 0) {
                    violation["Nơi giải quyết vụ việc"].forEach((place, i) => {
                        message += `📍 ${place}\n`;
                    });
                } else {
                    message += "🏢 Không có thông tin nơi giải quyết\n";
                }
                message += "\n";
            });

            return api.sendMessage(message, event.threadID, event.messageID);
        } else {
            return api.sendMessage(`✅ Biển số **${bienSo}** không có phạt nguội.`, event.threadID, event.messageID);
        }
    } catch (error) {
        console.error("❌ Lỗi khi kiểm tra phạt nguội:", error.message);
        return api.sendMessage("⚠️ Đã xảy ra lỗi khi kiểm tra. Vui lòng thử lại sau.", event.threadID, event.messageID);
    }
};
