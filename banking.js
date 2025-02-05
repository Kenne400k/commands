const axios = require('axios');
const fs = require('fs');
const { downloadFile } = require('./utils');  // Sử dụng hàm downloadFile từ utils
const apiKey = "<API_KEY>";
const clientId = "<CLIENT_ID>";

module.exports.config = {
    name: "banking",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "Pcoder",//cấm đổi prefix , ngồi code chết mẹ , tụi bây đi đổi prefix là hơi mất dạy á , muốn thì thêm mod <tên> vô
    description: "Lệnh bot cho các thao tác với VietQR",
    commandCategory: "tiện ích",
    usages: "/banking list\n/banking <ngânhang> qr <sdt> <amount> <noidung>\n/banking banking\n/banking tracuu <sdt>",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const phoneNumber = args[2] || "";  // Số điện thoại
    const amount = args[3] || "";  // Số tiền
    const description = args.slice(4).join(' ') || "";  // Nội dung chuyển khoản

    if (!args[0]) {
        return api.sendMessage("⚠️ Lệnh không hợp lệ. Vui lòng sử dụng:\n/banking list\n/banking <ngânhang> qr <sdt> <amount> <noidung>\n/banking banking\n/banking tracuu <sdt>", threadID, messageID);
    }

    const command = args[0].toLowerCase();

    // Lấy danh sách ngân hàng từ API
    let banksData;
    try {
        const bankInfo = await axios.get('https://api.vietqr.io/v2/banks');
        banksData = bankInfo.data.data;  // Lưu trữ dữ liệu ngân hàng
    } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách ngân hàng:", error);
        return api.sendMessage("⚠️ Lỗi khi lấy danh sách ngân hàng!", threadID, messageID);
    }

    // Tìm ngân hàng chính xác dựa trên tên hoặc mã ngân hàng
    const findBank = (input) => {
        const bank = banksData.find(bank => bank.shortName.toLowerCase().startsWith(input.toLowerCase()));
        return bank ? bank : null;
    };

    // Xử lý khi người dùng yêu cầu tạo mã QR
    if (command === "qr") {
        if (!phoneNumber || !amount || !description) {
            return api.sendMessage("⚠️ Vui lòng nhập đầy đủ thông tin. Ví dụ: /banking mb qr 0786888655 2000 test", threadID, messageID);
        }

        const bankInput = args[1]?.toLowerCase();  // Người dùng nhập tên ngân hàng

        if (!bankInput) {
            return api.sendMessage("⚠️ Vui lòng nhập tên ngân hàng. Ví dụ: /banking mb qr 0786888655 2000 test", threadID, messageID);
        }

        // Tìm ngân hàng chính xác
        const bank = findBank(bankInput);

        if (!bank) {
            return api.sendMessage("❌ Ngân hàng không tìm thấy, vui lòng nhập lại tên ngân hàng.", threadID, messageID);
        }

        const bankCode = bank.code;  // Mã ngân hàng
        const template = "compact";  // Template mã QR

        // Tạo URL mã QR với tất cả thông tin cần thiết
        const qrCodeUrl = `https://img.vietqr.io/image/${bankCode}-${phoneNumber}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(description)}`;

        // Tải ảnh QR và gửi cho người dùng
        try {
            const qrImagePath = __dirname + `/cache/${phoneNumber}_qr.png`;
            await downloadFile(qrCodeUrl, qrImagePath);  // Tải file về

            // Gửi ảnh qua messenger
            return api.sendMessage({
                body: `📱 Mã QR cho tài khoản ${phoneNumber}:\n💰 Số tiền: ${amount}\n📝 Nội dung: ${description}\n🔢 Số tài khoản: ${phoneNumber}`,
                attachment: fs.createReadStream(qrImagePath)
            }, threadID, messageID);
        } catch (error) {
            console.error("❌ Lỗi khi tạo mã QR:", error);
            return api.sendMessage("⚠️ Lỗi khi tạo mã QR!", threadID, messageID);
        }
    }

    // Xử lý các lệnh khác như banking hoặc tracuu
    else if (command === "banking") {
        const bankNameInput = args[1]?.toLowerCase();  // Người dùng nhập tên ngân hàng
        if (bankNameInput) {
            const bank = findBank(bankNameInput);

            if (bank) {
                const bankDetails = `
🏦 Tên ngân hàng: ${bank.name}
💳 Mã ngân hàng: ${bank.code}
🔢 Mã BIN: ${bank.bin}
🌐 Logo: ${bank.logo}
💸 Hỗ trợ chuyển tiền: ${bank.transferSupported ? "Có ✅" : "Không ❌"}
🔍 Hỗ trợ tra cứu: ${bank.lookupSupported ? "Có ✅" : "Không ❌"}
`;
                await api.sendMessage(bankDetails, threadID, messageID);
            } else {
                return api.sendMessage(`❌ Ngân hàng ${bankNameInput} không tìm thấy.`, threadID, messageID);
            }
        } else {
            return api.sendMessage("⚠️ Vui lòng nhập tên ngân hàng. Ví dụ: /banking <ngân hàng>", threadID, messageID);
        }
    }

    else if (command === "tracuu") {
        const phone = args[1];  // Số điện thoại
        if (!phone) {
            return api.sendMessage("⚠️ Vui lòng nhập số điện thoại cần tra cứu.", threadID, messageID);
        }

        try {
            const accountLookup = await axios.post('https://api.vietqr.io/v2/lookup', {
                bin: "970422",  // Mã ngân hàng mặc định (có thể thay bằng mã đúng)
                accountNumber: phone
            }, {
                headers: {
                    'x-api-key': apiKey,
                    'x-client-id': clientId,
                    'Content-Type': 'application/json',
                }
            });

            const accountInfo = accountLookup.data;
            const accountDetails = `
👤 Tên tài khoản: ${accountInfo.accountName}
🔢 Số tài khoản: ${accountInfo.accountNumber}
💡 Tình trạng: ${accountInfo.status ? "Hoạt động ✅" : "Không hoạt động ❌"}
`;
            await api.sendMessage(accountDetails, threadID, messageID);
        } catch (error) {
            console.error("❌ Lỗi khi tra cứu số tài khoản:", error);
            return api.sendMessage("⚠️ Lỗi khi tra cứu số tài khoản!", threadID, messageID);
        }
    }

    else {
        return api.sendMessage("⚠️ Lệnh không hợp lệ. Vui lòng sử dụng:\n/banking list\n/banking <ngânhang> qr <sdt> <amount> <noidung>\n/banking banking\n/banking tracuu <sdt>", threadID, messageID);
    }
};
