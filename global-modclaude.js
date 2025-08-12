const urls = require("./../../pdata/data_dongdev/datajson/vdgai.json");
const axios = require("axios");
const fs = require("fs");

let agent;

class Command {
  constructor(config) {
    this.config = config;
    global.khanhdayr = [];
    this.isUploading = false;
    this.uploadCount = 0;
    this.maxConcurrentUploads = 5;
    this.minQueueSize = 20;
    this.maxQueueSize = 30;
    this.uploadBatchSize = 15;
  }

  async onLoad(o) {
    if (!global.client.xôx) {
      global.client.xôx = setInterval(async () => {
        await this.checkAndUploadVideos(o);
      }, 2000);

      console.log("🚀 INFINITE Auto video upload system started!");
      console.log(`📊 Queue settings: Target=30, Trigger=<20, Batch=${this.uploadBatchSize}`);
    }

    async function streamURL(url, type, retries = 2) {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await axios({
            method: "GET",
            url,
            responseType: "stream",
            timeout: 25000,
            httpsAgent: agent,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              Accept: "*/*",
            },
          });

          const filePath = `${__dirname}/cache/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${type}`;
          
          const cacheDir = `${__dirname}/cache`;
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }

          const writer = fs.createWriteStream(filePath);
          
          await new Promise((resolve, reject) => {
            response.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", reject);
            
            setTimeout(() => {
              writer.destroy();
              reject(new Error("File write timeout"));
            }, 40000);
          });

          setTimeout(() => {
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (err) {
            }
          }, 90 * 1000);

          return fs.createReadStream(filePath);
        } catch (error) {
          if (attempt === retries) {
            console.log(`❌ Failed to stream after ${retries + 1} attempts: ${error.message}`);
            throw error;
          }
          console.log(`⚠️ Retry streaming (${attempt + 1}/${retries + 1}): ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    async function upload(url, retries = 1) {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const uploadRes = await o.api.httpPostFormData(
            "https://upload.facebook.com/ajax/mercury/upload.php",
            { upload_1024: await streamURL(url, "mp4") }
          );
          
          const meta = JSON.parse(uploadRes.replace("for (;;);", ""));
          const result = Object.entries(meta.payload?.metadata?.[0] || {})[0];
          
          if (result) {
            return result;
          } else {
            throw new Error("No metadata returned");
          }
        } catch (error) {
          if (attempt === retries) {
            console.log(`❌ Upload failed after ${retries + 1} attempts: ${error.message}`);
            return null;
          }
          console.log(`⚠️ Retry upload (${attempt + 1}/${retries + 1}): ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        }
      }
    }

    this.uploadFunction = upload;
  }

  async checkAndUploadVideos(o) {
    try {
      const currentVideoCount = global.khanhdayr.length;
      
      if (currentVideoCount < this.minQueueSize && !this.isUploading) {
        this.isUploading = true;
        
        const videosNeeded = Math.min(
          this.maxQueueSize - currentVideoCount,
          this.uploadBatchSize
        );
        
        if (videosNeeded > 0) {
          console.log(`🔄 Queue low (${currentVideoCount}/${this.minQueueSize}), uploading ${videosNeeded} videos to reach 30...`);
          
          const randomUrls = [];
          for (let i = 0; i < videosNeeded; i++) {
            const randomUrl = urls[Math.floor(Math.random() * urls.length)];
            randomUrls.push(randomUrl);
          }
          
          const uploadPromises = randomUrls.map(url => 
            this.uploadFunction(url).catch(err => {
              console.log(`Upload error: ${err.message}`);
              return null;
            })
          );
          
          const results = await Promise.allSettled(uploadPromises);
          
          const successfulUploads = results
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value);
          
          if (successfulUploads.length > 0) {
            global.khanhdayr.push(...successfulUploads);
            this.uploadCount += successfulUploads.length;
            console.log(`✅ Uploaded ${successfulUploads.length}/${videosNeeded} videos successfully - Target: 30 videos`);
            console.log(`📊 Total uploaded: ${this.uploadCount}, Current queue: ${global.khanhdayr.length}/30`);
          } else {
            console.log(`❌ No videos uploaded successfully from this batch`);
          }
        }
        
        this.isUploading = false;
      }
      
      if (currentVideoCount > this.maxQueueSize) {
        const excess = currentVideoCount - this.maxQueueSize;
        console.log(`🧹 Queue overflow, removing ${excess} oldest videos`);
        global.khanhdayr.splice(0, excess);
      }
      
    } catch (error) {
      console.log("❌ Error in checkAndUploadVideos:", error.message);
      this.isUploading = false;
    }
  }

  resetUploadSystem() {
    this.uploadCount = 0;
    this.isUploading = false;
    global.khanhdayr = [];
    console.log("🔄 Upload system reset!");
  }

  updateQueueSettings(minSize, maxSize, batchSize) {
    this.minQueueSize = minSize || this.minQueueSize;
    this.maxQueueSize = maxSize || this.maxQueueSize;
    this.uploadBatchSize = batchSize || this.uploadBatchSize;
    console.log(`⚙️ Queue settings updated: Min=${this.minQueueSize}, Max=${this.maxQueueSize}, Batch=${this.uploadBatchSize}`);
  }

  async run(o) {
    try {
      const response = await axios.get(
        "https://raw.githubusercontent.com/Sang070801/api/main/thinh1.json",
        { timeout: 8000 }
      );
      
      const data = response.data;
      const thinhArray = Object.values(data.data);
      const randomThinh = thinhArray[Math.floor(Math.random() * thinhArray.length)];

      const send = (msg) =>
        new Promise((r) =>
          o.api.sendMessage(msg, o.event.threadID, (err, res) => r(res || err), o.event.messageID)
        );

      const t = process.uptime();
      const days = Math.floor(t / 86400);
      const h = Math.floor((t % 86400) / 3600);
      const p = Math.floor((t % 3600) / 60);
      const s = Math.floor(t % 60);

      const attachment = global.khanhdayr.length > 0 ? global.khanhdayr.splice(0, 1) : [];

      const queueHealth = global.khanhdayr.length >= this.minQueueSize ? "🟢 Healthy" : "🔴 Low - Uploading";
      const queueStatus = global.khanhdayr.length === this.maxQueueSize ? "📱 FULL (30/30)" : 
                         global.khanhdayr.length >= 25 ? "📊 High" :
                         global.khanhdayr.length >= 20 ? "📈 Good" : "📉 Low";
      
      const statusMessage = `🤖 AUTO-30 UPLOAD BOT\n` +
        `⏰ Uptime: ${days > 0 ? days + 'd ' : ''}${h.toString().padStart(2, '0')}:${p.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}\n` +
        `📹 Queue: ${global.khanhdayr.length}/30 ${queueStatus}\n` +
        `📊 Total uploaded: ${this.uploadCount.toLocaleString()}\n` +
        `🔄 Status: ${this.isUploading ? 'Uploading to 30...' : queueHealth}\n` +
        `⚙️ Auto-Upload: <20 → Upload to 30\n` +
        `📈 System: ${global.khanhdayr.length < 20 ? 'UPLOADING...' : 'MAINTAINING 30'}\n` +
        `${randomThinh ? `💭 ${randomThinh}` : ''}`;

      console.log(`📤 Status - Queue: ${global.khanhdayr.length}, Total: ${this.uploadCount}, Uploading: ${this.isUploading}`);

      await send({
        body: statusMessage,
        attachment: attachment
      });

    } catch (error) {
      console.log("❌ Error in run method:", error.message);
      
      const send = (msg) =>
        new Promise((r) =>
          o.api.sendMessage(msg, o.event.threadID, (err, res) => r(res || err), o.event.messageID)
        );
      
      await send(`❌ Bot error occurred!\n🔧 Queue: ${global.khanhdayr.length}/30\n📊 Total: ${this.uploadCount}\n⚠️ ${error.message.substring(0, 80)}`);
    }
  }
}

module.exports = new Command({
  name: "global",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "Pcoder DC-NAM", // mod AI CLAUDE
  description: "Auto upload system: <20 videos → Upload to 30 videos continuously!",
  commandCategory: "Tiện ích",
  usages: "[]",
  cooldowns: 2,
});
