const urls = require("./../../pdata/data_dongdev/datajson/vdgai.json");
const axios = require("axios");
const fs = require("fs");

let agent;

class Command {
  constructor(config) {
    this.config = config;
    global.khanhdayr = [];
  }

  async onLoad(o) {
    let status = false;

    if (!global.client.xôx) {
      global.client.xôx = setInterval(async () => {
        if (status === true || global.khanhdayr.length > 10) return;
        status = true;
        try {
          const results = await Promise.all(
            [...Array(5)].map(() => upload(urls[Math.floor(Math.random() * urls.length)]))
          );
          console.log(results);
          global.khanhdayr.push(...results);
        } finally {
          status = false;
        }
      }, 5000);
    }

    async function streamURL(url, type) {
      const response = await axios({
        method: "GET",
        url,
        responseType: "stream",
        timeout: 15000,
        httpsAgent: agent,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "*/*",
        },
      });

      const filePath = `${__dirname}/cache/${Date.now()}.${type}`;
      const writer = fs.createWriteStream(filePath);

      await new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      setTimeout(() => fs.unlinkSync(filePath), 60 * 1000, filePath);
      return fs.createReadStream(filePath);
    }

    async function upload(url) {
      const uploadRes = await o.api.httpPostFormData(
        "https://upload.facebook.com/ajax/mercury/upload.php",
        { upload_1024: await streamURL(url, "mp4") }
      );
      const meta = JSON.parse(uploadRes.replace("for (;;);", ""));
      return Object.entries(meta.payload?.metadata?.[0] || {})[0];
    }
  }

  async run(o) {
    const response = await axios.get(
      "https://raw.githubusercontent.com/Sang070801/api/main/thinh1.json"
    );
    const data = response.data;
    const thinhArray = Object.values(data.data);
    const randomThinh = thinhArray[Math.floor(Math.random() * thinhArray.length)];

    const send = (msg) =>
      new Promise((r) =>
        o.api.sendMessage(msg, o.event.threadID, (err, res) => r(res || err), o.event.messageID)
      );

    const t = process.uptime();
    const h = Math.floor(t / 3600);
    const p = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);

    console.log(global.khanhdayr);

    await send({
      body: `Thời gian hoạt động\n            ${h}:${p}:${s}`,
      attachment: global.khanhdayr.splice(0, 1),
    });
  }
}

module.exports = new Command({
  name: "global",
  version: "0.0.1",
  hasPermssion: 2,
  credits: "DC-Nam, fix 429 Pcoder",
  description: "",
  commandCategory: "Tiện ích",
  usages: "[]",
  cooldowns: 0,
});
