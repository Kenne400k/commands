/*
cách lấy apikey
B1: Truy cập web 
https://elevenlabs.io
B2: nhấp vô signup và tạo tài khoản hoặc đăng Nhập
B3: bấm vào avatar
B4: bấm chọn API Keys
B5: Create API Keys
B6: đặt đại tên
B7: tìm phần tên là Text to Speech chọn No access -> Has access
B8: bấm vô create
B9: Copy apikey lại dán vào 
*/
// ⚠️ Thay API key của bạn tại đây
const apiKey = "APIKEY";
// dán apikey vào "APIKEY"; 
// lỗi gì thì ib qua 
//                fb.com/pcoder090
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const VOICES = {
  "my": { id: "EXAVITQu4vr4xnSDxMaL", name: "Mỹ Linh (nữ)" },
  "duy": { id: "BUPPIXeDaJWBz696iXRS", name: "Duy (nam)" },
  "nga": { id: "ywBZEqUhld86Jeajq94o", name: "Ngà (nữ nhẹ nhàng)" }
};
const voicemacdinh = "my"; 

module.exports.config = {
  name: "say",
  version: "2.6.0",
  hasPermssion: 0,
  credits: "Pcoder", // thay credit cái địt mẹ mày
  description: "TTS ElevenLabs (Flash v2.5) - hỗ trợ nhiều giọng riêng cho từng nhóm",
  commandCategory: "media",
  usages: "[text] | set <voice> | list",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Threads }) {
  const threadID = event.threadID;

  if (args[0] === "list") {
    const list = Object.entries(VOICES)
      .map(([code, v]) => `👉 ${code} = ${v.name}`)
      .join("\n");
    return api.sendMessage(`📢 Các giọng có thể chọn:\n${list}`, threadID, event.messageID);
  }

  if (args[0] === "set") {
    const voiceCode = args[1]?.toLowerCase();
    if (!VOICES[voiceCode])
      return api.sendMessage("❌ Giọng không hợp lệ. Dùng: say list để xem các giọng!", threadID, event.messageID);

    const threadData = await Threads.getData(threadID) || {};
    threadData.voice_code = voiceCode;
    await Threads.setData(threadID, threadData);

    return api.sendMessage(`✅ Đã chọn giọng: ${VOICES[voiceCode].name}`, threadID, event.messageID);
  }

  const text = event.type === "message_reply"
    ? event.messageReply.body
    : args.join(" ");

  if (!text)
    return api.sendMessage("❌ Nhập nội dung để đọc!", threadID, event.messageID);

  const voiceCode = (await Threads.getData(threadID))?.voice_code || voicemacdinh;
  const voice = VOICES[voiceCode];
  if (!voice) return api.sendMessage("❌ Không tìm thấy giọng đã chọn!", threadID, event.messageID);

  const filePath = path.join(__dirname, "cache", `${threadID}_${event.senderID}.mp3`);

  try {
    const res = await axios({
      method: "POST",
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`,
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json"
      },
      responseType: "arraybuffer",
      data: {
        text,
        model_id: "eleven_flash_v2_5",
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.9,
          style: 0.0,
          use_speaker_boost: true
        }
      }
    });

    fs.writeFileSync(filePath, res.data);

    return api.sendMessage({
      body: `🔊 Đã đọc bằng giọng: ${voice.name}`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), event.messageID);

  } catch (err) {
    console.error("TTS error:", err?.response?.data || err.message);
    return api.sendMessage("❌ Lỗi khi tạo giọng nói. Kiểm tra lại API key hoặc voice ID!", threadID, event.messageID);
  }
};
