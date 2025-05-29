// Xóa sạch terminal (tương thích đa nền tảng)
process.stdout.write('\x1Bc');

const fs = require("fs");
const path = require("path");
const CFonts = require('cfonts');
const chalk = require('chalk');
const axios = require("axios");
const semver = require("semver");
const moment = require("moment-timezone");

const CACHE_SUFFIX = ".sync-cache.json";
const IGNORED_FILE = ".sync-ignore-list.json"; // file chứa danh sách file không hỏi nữa

// Đọc cache các file từng có ở local
function readCache(cacheFile) {
  if (!fs.existsSync(cacheFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  } catch (e) {
    return [];
  }
}

// Ghi lại cache các file local đã có lần sync này
function writeCache(cacheFile, files) {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(files), "utf8");
  } catch (e) {}
}

// Đọc danh sách file đã chọn "nn" (không hỏi lại nữa, không tải nữa)
function readIgnoreList() {
  if (!fs.existsSync(IGNORED_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(IGNORED_FILE, "utf8"));
  } catch (e) {
    return [];
  }
}

// Ghi lại danh sách file đã chọn "nn"
function writeIgnoreList(files) {
  try {
    fs.writeFileSync(IGNORED_FILE, JSON.stringify(files), "utf8");
  } catch (e) {}
}

async function downloadAndSave(remoteFile, RAW_PREFIX, localDir) {
  try {
    const { data: remoteContent } = await axios.get(RAW_PREFIX + remoteFile.name, { responseType: 'arraybuffer' });
    fs.writeFileSync(path.join(localDir, remoteFile.name), Buffer.from(remoteContent));
    console.log(chalk.greenBright(`[SYNC] Đã thêm mới: ${remoteFile.name}`));
  } catch (e) {
    console.log(chalk.redBright(`[SYNC] Lỗi tải file ${remoteFile.name}: ${e.message}`));
  }
}

async function syncOnlyAddNew(localDir, githubDir) {
  const REMOTE_LIST_URL = `https://api.github.com/repos/Kenne400k/k/contents/${githubDir}`;
  const RAW_PREFIX = `https://raw.githubusercontent.com/Kenne400k/k/main/${githubDir}/`;
  const cacheFile = path.join(localDir, CACHE_SUFFIX);

  // Đọc danh sách file ignore (không hỏi, không tải)
  let ignoreList = readIgnoreList();

  try {
    console.log(chalk.cyanBright(`[SYNC] Đang kiểm tra và đồng bộ file mới từ GitHub: ${githubDir}`));
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

    // Lấy danh sách file remote
    const { data: remoteFiles } = await axios.get(REMOTE_LIST_URL, {
      headers: { 'User-Agent': 'mirai-bot-syncmodules' }
    });
    const remoteJsFiles = remoteFiles.filter(f => f.type === "file" && /\.(js|json|ts|cjs|mjs)$/i.test(f.name));

    // Lấy danh sách file local hiện tại
    const localFiles = fs.readdirSync(localDir).filter(f => /\.(js|json|ts|cjs|mjs)$/i.test(f));

    // Lấy cache lần trước (dùng nhận diện file đã từng có)
    const cachedFiles = readCache(cacheFile);

    // Những file trên GitHub mà local không có
    const missingFiles = remoteJsFiles.filter(f => !localFiles.includes(f.name));

    // Tách file hoàn toàn mới và file đã từng có (bị xóa local)
    const newFiles = missingFiles.filter(f => !cachedFiles.includes(f.name));
    let deletedFiles = missingFiles.filter(f => cachedFiles.includes(f.name));

    // Loại bỏ các file đã ignore khỏi deletedFiles
    deletedFiles = deletedFiles.filter(f => !ignoreList.includes(f.name));

    // Nếu tổng số file mới > 10 thì hỏi ý kiến 1 lần
    if (missingFiles.length > 10) {
      console.log(chalk.yellowBright(`[SYNC] Có ${missingFiles.length} lệnh mới (bao gồm ${deletedFiles.length} lệnh đã từng có và ${newFiles.length} lệnh hoàn toàn mới). Bạn có muốn tải về không? (y/n)`));
      process.stdin.setEncoding('utf8');
      await new Promise(resolve => {
        process.stdin.once('data', async (answer) => {
          if (answer.trim().toLowerCase() === 'y') {
            for (const remoteFile of missingFiles) {
              await downloadAndSave(remoteFile, RAW_PREFIX, localDir);
            }
            console.log(chalk.greenBright(`[SYNC] Đã đồng bộ xong ${missingFiles.length} file mới từ ${githubDir}.`));
          } else {
            console.log(chalk.yellowBright(`[SYNC] Bỏ qua việc tải lệnh mới.`));
          }
          resolve();
        });
      });
    } else {
      // Tải tự động các file hoàn toàn mới
      for (const remoteFile of newFiles) {
        await downloadAndSave(remoteFile, RAW_PREFIX, localDir);
      }
      // Với các file đã từng có mà bị xóa local, hỏi từng file có muốn tải lại không
      for (const remoteFile of deletedFiles) {
        // Thông báo hướng dẫn nhập nn
        console.log(
          chalk.yellowBright(`[SYNC] File "${remoteFile.name}" đã từng có ở local nhưng bạn đã xóa. Bạn có muốn tải lại không? (y/n, nhập "nn" để không bao giờ hỏi lại lệnh này)`));
        console.log(
          chalk.yellowBright('[SYNC] Nếu bạn không muốn bị hỏi tải lại lệnh đã xóa, hãy nhập ') +
          chalk.magenta('nn') +
          chalk.yellowBright(' để không tải xuống và không hỏi lại nữa!')
        );
        process.stdin.setEncoding('utf8');
        await new Promise(resolve => {
          process.stdin.once('data', async (answer) => {
            const ans = answer.trim().toLowerCase();
            if (ans === 'y') {
              await downloadAndSave(remoteFile, RAW_PREFIX, localDir);
            } else if (ans === 'nn') {
              ignoreList.push(remoteFile.name);
              writeIgnoreList(ignoreList);
              console.log(chalk.gray(`[SYNC] File "${remoteFile.name}" đã được thêm vào danh sách không hỏi lại.`));
            } else {
              console.log(chalk.yellowBright(`[SYNC] Bỏ qua: ${remoteFile.name}`));
            }
            resolve();
          });
        });
      }
      if (missingFiles.length === 0) {
        console.log(chalk.yellowBright(`[SYNC] Không có file mới nào trong ${githubDir}.`));
      } else {
        console.log(chalk.greenBright(`[SYNC] Đã đồng bộ xong ${newFiles.length} file mới từ ${githubDir}.`));
      }
    }

    // Ghi lại cache trạng thái các file sau khi sync để lần sau nhận diện
    writeCache(cacheFile, Array.from(new Set([...localFiles, ...missingFiles.map(f => f.name)])));

  } catch (err) {
    console.log(chalk.redBright(`[SYNC] Lỗi đồng bộ ${githubDir}: ${err.message}`));
  }
}

async function syncModulesAndEvents() {
  await syncOnlyAddNew(path.join(__dirname, "modules", "commands"), "modules/commands");
  await syncOnlyAddNew(path.join(__dirname, "modules", "events"), "modules/events");
}

// ============= KHỞI ĐỘNG GIAO DIỆN LOGO, QUẢNG CÁO, UPDATE... =============

(async () => {
  // Dynamic import ESM modules (boxen, chalk-animation)
  const boxen = (await import('boxen')).default;
  const chalkAnimation = await import('chalk-animation');

  // Animation khởi động - bên trái
  const anim = chalkAnimation.default.rainbow('>>> MIRAI đang khởi động... <<<');
  await new Promise(r => setTimeout(r, 3000));
  anim.stop();

  // Logo MIRAI, sát lề trái (không căn giữa)
  CFonts.say('MIRAI BOT', {
    font: 'block',
    align: 'left',
    colors: ['cyan', 'magenta', 'yellow', 'white', 'blue'],
    background: 'transparent',
    letterSpacing: 2,
    lineHeight: 1,
    space: true,
    maxLength: '0'
  });

  // Quảng cáo nổi bật, có khung, emoji, nhiều màu sắc
  const fb = chalk.hex('#00acee').underline.bold('https://fb.com/pcoder090');
  const zalo = chalk.hex('#25d366').underline.bold('https://zalo.me/0786888655');
  const banner =
    chalk.hex('#FFD700').bold('⚡ MUA FILE BOT - LIÊN HỆ NGAY! ⚡\n') +
    chalk.white('Facebook: ') + fb +
    chalk.hex('#FFD700').bold(' | ') +
    chalk.white('Zalo: ') + zalo +
    ' ' + chalk.redBright('🔥');
  console.log(
    boxen(banner, {
      padding: 1,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'yellow',
      backgroundColor: '#111',
      title: chalk.bgYellow.black('  QUẢNG CÁO  '),
      titleAlignment: 'center'
    })
  );

  // Kiểm tra phiên bản
  const LOCAL_VERSION = "5.0.0";
  const GITHUB_RAW_URL = "https://raw.githubusercontent.com/Kenne400k/commands/main/index.js";
  console.log(chalk.cyanBright(`[AUTO-UPDATE] Kiểm tra phiên bản trên GitHub...`));
  try {
    const { data: remoteSource } = await axios.get(GITHUB_RAW_URL, { timeout: 7000 });
    const m = remoteSource.match(/LOCAL_VERSION\s*=\s*["'`](\d+\.\d+\.\d+)["'`]/i);
    const remoteVersion = m && m[1] ? m[1] : null;
    console.log(chalk.gray(`[DEBUG] Remote version extract:`), chalk.green(remoteVersion));

    if (!remoteVersion) {
      console.log(chalk.yellowBright('[UPDATE] Không xác định được version remote, tiếp tục chạy bản local.'));
    } else if (semver.eq(LOCAL_VERSION, remoteVersion)) {
      console.log(chalk.greenBright(`[CHECK] Phiên bản đang dùng là mới nhất: ${LOCAL_VERSION}`));
    } else if (semver.lt(LOCAL_VERSION, remoteVersion)) {
      console.log(chalk.cyanBright(`[UPGRADE] Có bản mới: ${remoteVersion}. Đang cập nhật...`));
      fs.writeFileSync(__filename, remoteSource, 'utf8');
      console.log(chalk.bgGreen.black(`[THÀNH CÔNG] Đã cập nhật lên bản mới: ${remoteVersion}`));
      const { spawn } = require("child_process");
      spawn(process.argv[0], [__filename, ...process.argv.slice(2)], { stdio: "inherit" });
      process.exit(0);
    } else {
      console.log(chalk.yellowBright(`[INFO] Bản local mới hơn remote. Tiếp tục chạy bản local.`));
    }
  } catch (e) {
    console.log(chalk.redBright(`[ERROR] Không thể kiểm tra/cập nhật phiên bản mới: ${e.message}`));
  }

  // ĐỒNG BỘ MODULES/COMMANDS & EVENTS CHỈ THÊM MỚI (KHÔNG XÓA)
  await syncModulesAndEvents();

  // Thông tin trạng thái và slogan (bên trái)
  const now = moment().format("YYYY-MM-DD HH:mm:ss");
  console.log(
    chalk.bgRed.white.bold(`  ${now}  `) +
    chalk.bgBlue.white.bold(`  Theme: MIRAI  `) +
    chalk.bgGreen.white.bold(`  Version: ${LOCAL_VERSION}  `) +
    chalk.bgYellow.black.bold(`  PID: ${process.pid}  `)
  );
  console.log(chalk.hex('#FFD700')('='.repeat(50)));
  console.log(chalk.hex('#ff00cc').italic('MiraiBot | PCODER | Chúc bạn một ngày chạy bot vui vẻ!'));
  console.log(chalk.hex('#FFD700')('='.repeat(50)));

  // Fancy Logger + Package/Module Check
  const fancyLog = (type, msg, tag = "") => {
    let icons = { success: '✔', warn: '⚠', error: '✖', info: 'ℹ' };
    let colors = {
      success: chalk.greenBright, warn: chalk.yellowBright,
      error: chalk.redBright, info: chalk.cyanBright
    };
    let icon = colors[type] ? colors[type](icons[type]) : icons.info;
    let tagStr = tag ? chalk.bgHex("#333").white.bold(` ${tag} `) : "";
    let t = chalk.gray(`[${moment().format("HH:mm:ss")}]`);
    if (type === "error")
      console.log(t, icon, tagStr, chalk.red.underline.bold(msg));
    else
      console.log(t, icon, tagStr, colors[type] ? colors[type](msg) : msg);
  };
  fs.readFile('package.json', 'utf8', (err, data) => {
    if (!err) {
      try {
        const packageJson = JSON.parse(data);
        const dependencies = packageJson.dependencies || {};
        const totalDependencies = Object.keys(dependencies).length;
        fancyLog("success", `Tổng package: ${totalDependencies}`, "PACKAGE");
      } catch (_) {}
    }
    try {
      var files = fs.readdirSync('./modules/commands');
      files.forEach(file => { if (file.endsWith('.js')) require(`./modules/commands/${file}`); });
      fancyLog("success", 'Tiến hành check lỗi', 'AUTO-CHECK');
      fancyLog("success", 'Không phát hiện lỗi ở modules', 'AUTO-CHECK');
    } catch (error) {
      fancyLog("error", 'Lỗi ở lệnh:', 'AUTO-CHECK');
      console.log(error);
    }
  });

  // Tiếp tục khởi động bot như cũ
  const { spawn } = require("child_process");
  function startBot(message) {
    if (message) fancyLog("info", message, "BẮT ĐẦU");
    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "main.js"], {
      cwd: __dirname,
      stdio: "inherit",
      shell: true
    });
    child.on("close", (codeExit) => {
      if (codeExit != 0 || (global.countRestart && global.countRestart < 5)) {
        startBot("Mirai Loading - Đang khởi động lại...");
        global.countRestart = (global.countRestart || 0) + 1;
        return;
      }
    });
    child.on("error", function (error) {
      fancyLog("error", "Lỗi: " + JSON.stringify(error), "BẮT ĐẦU");
    });
  }

  // LOGIN FACEBOOK TOKEN và các hàm login như cũ
  const deviceID = require('uuid');
  const adid = require('uuid');
  const totp = require('totp-generator');
  const config = require("./config.json");

  const logacc = require('./acc.json');
  async function login(){
    if(config.ACCESSTOKEN !== "") return;
    if (!logacc || !logacc.EMAIL) return fancyLog("error", 'Thiếu email tài khoản', "LOGIN");
    var uid = logacc.EMAIL;
    var password = logacc.PASSWORD;
    var fa = logacc.OTPKEY;

    var form = {
        adid: adid.v4(),
        email: uid,
        password: password,
        format: 'json',
        device_id: deviceID.v4(),
        cpl: 'true',
        family_device_id: deviceID.v4(),
        locale: 'en_US',
        client_country_code: 'US',
        credentials_type: 'device_based_login_password',
        generate_session_cookies: '1',
        generate_analytics_claim: '1',
        generate_machine_id: '1',
        currently_logged_in_userid: '0',
        try_num: "1",
        enroll_misauth: "false",
        meta_inf_fbmeta: "NO_FILE",
        source: 'login',
        machine_id: randomString(24),
        meta_inf_fbmeta: '',
        fb_api_req_friendly_name: 'authenticate',
        fb_api_caller_class: 'com.facebook.account.login.protocol.Fb4aAuthHandler',
        api_key: '882a8490361da98702bf97a021ddc14d',
        access_token: '275254692598279|585aec5b4c27376758abb7ffcb9db2af'
    };

    form.sig = encodesig(sort(form));
    var options = {
        url: 'https://b-graph.facebook.com/auth/login',
        method: 'post',
        data: form,
        transformRequest: [
            (data, headers) => {
                return require('querystring').stringify(data)
            },
        ],
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            "x-fb-friendly-name": form["fb_api_req_friendly_name"],
            'x-fb-http-engine': 'Liger',
            'user-agent': 'Mozilla/5.0 (Linux; Android 12; TECNO CH9 Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/109.0.5414.118 Mobile Safari/537.36[FBAN/EMA;FBLC/pt_BR;FBAV/339.0.0.10.100;]',
        }
    }
    axios(options).then(i => {
      var sessionCookies = i.data.session_cookies;
      var cookies = sessionCookies.reduce((acc, cookie) => acc += `${cookie.name}=${cookie.value};`, "");
      if(i.data.access_token){
        config.ACCESSTOKEN = i.data.access_token
        saveConfig(config)
      }
    }).catch(async function (error) {
      var data = error.response.data.error.error_data;
      form.twofactor_code = totp(decodeURI(fa).replace(/\s+/g, '').toLowerCase())
      form.encrypted_msisdn = ""
      form.userid = data.uid
      form.machine_id = data.machine_id
      form.first_factor = data.login_first_factor
      form.credentials_type = "two_factor"
      await new Promise(resolve => setTimeout(resolve, 2000));
      delete form.sig
      form.sig = encodesig(sort(form))
      var option_2fa = {
          url: 'https://b-graph.facebook.com/auth/login',
          method: 'post',
          data: form,
          transformRequest: [
              (data, headers) => {
                  return require('querystring').stringify(data)
              },
          ],
          headers: {
              'content-type': 'application/x-www-form-urlencoded',
              'x-fb-http-engine': 'Liger',
              'user-agent': 'Mozilla/5.0 (Linux; Android 12; TECNO CH9 Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/109.0.5414.118 Mobile Safari/537.36[FBAN/EMA;FBLC/pt_BR;FBAV/339.0.0.10.100;]',
          }
      }
      axios(option_2fa).then(i => {
        var sessionCookies = i.data.session_cookies;
        var cookies = sessionCookies.reduce((acc, cookie) => acc += `${cookie.name}=${cookie.value};`, "");
        if(i.data.access_token){
          config.ACCESSTOKEN = i.data.access_token
          saveConfig(config)
        }
      }).catch(function (error) {
        fancyLog("error", error.response.data, "LOGIN");
      })
    });
  }

  function saveConfig(data) {
    setTimeout(()=>{
      const json = JSON.stringify(data,null,4);
      fs.writeFileSync(`./config.json`, json);
    },50)
  }
  function randomString(length) {
      length = length || 10
      var char = 'abcdefghijklmnopqrstuvwxyz'
      char = char.charAt(
          Math.floor(Math.random() * char.length)
      )
      for (var i = 0; i < length - 1; i++) {
          char += 'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(
              Math.floor(36 * Math.random())
          )
      }
      return char
  }
  function encodesig(string) {
      var data = ''
      Object.keys(string).forEach(function (info) {
          data += info + '=' + string[info]
      })
      data = md5(data + '62f8ce9f74b12f84c123cc23437a4a32')
      return data
  }
  function md5(string) {
      return require('crypto').createHash('md5').update(string).digest('hex')
  }
  function sort(string) {
      var sor = Object.keys(string).sort(),
          data = {},
          i
      for (i in sor)
          data[sor[i]] = string[sor[i]]
      return data
  }

  async function startb(){
    if(config.ACCESSTOKEN !== "") {
      startBot();
    } else {
      login()
      setTimeout(()=>{
        startBot();
      },7000)
    }
  }
  startb()
})();
