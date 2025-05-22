// ====== CLEAR CONSOLE ======
console.clear();

const { spawn } = require("child_process");
const fs = require("fs");
const axios = require("axios");
const deviceID = require('uuid');
const adid = require('uuid');
const totp = require('totp-generator');
const moment = require("moment-timezone");
const chalk = require('chalk');
const gradient = require('gradient-string');
const CFonts = require('cfonts');
const config = require("./config.json");
const theme = config.DESIGN?.Theme || "rainbow";

// ===== 7 SẮC CẦU VỒNG ĐẶC BIỆT =====
const rainbowArr = [
  "#FF0000", // Đỏ
  "#FF7F00", // Cam
  "#FFFF00", // Vàng
  "#00FF00", // Xanh lá
  "#0000FF", // Xanh dương
  "#4B0082", // Chàm
  "#9400D3"  // Tím
];

const rainbowGradient = gradient(rainbowArr);

// ====== LOGO CỰC ĐẸP + HIỆU ỨNG SHADOW ======
const logo = [
  "██████╗░░█████╗░░█████╗░██████╗░███████╗██████╗░",
  "██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗",
  "██████╔╝██║░░╚═╝██║░░██║██║░░██║█████╗░░██████╔╝",
  "██╔═══╝░██║░░██╗██║░░██║██║░░██║██╔══╝░░██╔══██╗",
  "██║░░░░░╚█████╔╝╚█████╔╝██████╔╝███████╗██║░░██║",
  "╚═╝░░░░░░╚════╝░░╚════╝░╚═════╝░╚══════╝╚═╝░░╚═╝"
];

// ===== BANNER & HEADER =====
function printBanner() {
  // Border trên
  const border = chalk.hex('#FFD700')('═'.repeat(logo[0].length + 12));
  console.log('\n' + border);

  // In logo, viền trái/phải, hiệu ứng shadow
  logo.forEach((line, i) => {
    let pad = "      ";
    let shadow = chalk.hex('#222')(line.replace(/[^ ]/g, '░')); // tạo hiệu ứng bóng
    if (i === 0) shadow = "";
    console.log(
      chalk.hex('#FFD700')('║') +
      pad +
      rainbowGradient(line) +
      pad +
      chalk.hex('#FFD700')('║') +
      (i > 0 ? chalk.hex('#222').dim('  ' + shadow) : "")
    );
  });
  // Border dưới
  console.log(border);

  // PCODER/MIRAI BOT với font chrome hoặc shade cho cực chất
  CFonts.say('MIRAI BOT', {
    font: 'chrome', // "chrome" hoặc "shade" hoặc "block"
    align: 'center',
    colors: rainbowArr.map(c => c.replace('#', '')), // dùng mã classic
    background: 'transparent',
    letterSpacing: 2,
    lineHeight: 1,
    space: true,
    maxLength: '0'
  });

  // Thông tin trạng thái nổi bật
  const now = moment().format("YYYY-MM-DD HH:mm:ss");
  console.log(
    chalk.bgRed.white.bold(`  ${now}  `) +
    chalk.bgBlue.white.bold(`  Theme: 7 SẮC CẦU VỒNG  `) +
    chalk.bgYellow.black.bold(`  PID: ${process.pid}  `)
  );
  // Slogan, gạch chân
  console.log(chalk.hex('#FFD700')('═'.repeat(logo[0].length + 15)));
  console.log(
    chalk.hex('#ff00cc').italic('   🌈 MiraiBot - Đẳng cấp Console Việt Nam | Kenne400k | Chúc bạn một ngày chạy bot vui vẻ! 🌈')
  );
  console.log(chalk.hex('#FFD700')('═'.repeat(logo[0].length + 15)));
}

// ===== LOGGER SIÊU VIP =====
function fancyLog(type, msg, tag = "") {
  let icon, color;
  switch(type) {
    case "success":
      icon = chalk.greenBright('✔');
      color = chalk.greenBright;
      break;
    case "warn":
      icon = chalk.yellowBright('⚠');
      color = chalk.yellowBright;
      break;
    case "error":
      icon = chalk.redBright('✖');
      color = chalk.redBright;
      break;
    case "info":
    default:
      icon = chalk.cyanBright('ℹ');
      color = chalk.cyanBright;
      break;
  }
  const tagStr = tag ? chalk.bgHex("#333").white.bold(` ${tag} `) : "";
  const t = chalk.gray(`[${moment().format("HH:mm:ss")}]`);
  // Gạch chân cho tag lỗi
  if (type === "error") {
    console.log(t, icon, tagStr, chalk.red.underline.bold(msg));
  } else {
    console.log(t, icon, tagStr, color(msg));
  }
}

// ===== IN BANNER =====
printBanner();

// ===== PACKAGE CHECKER =====
fs.readFile('package.json', 'utf8', (err, data) => {
  if (err) return;
  try {
    const packageJson = JSON.parse(data);
    const dependencies = packageJson.dependencies || {};
    const totalDependencies = Object.keys(dependencies).length;
    fancyLog("success", `Hiện tại tổng có ${totalDependencies} Package`, "PACKAGE");
  } catch (_) { }
  // ===== MODULE CHECKER =====
  try {
    var files = fs.readdirSync('./modules/commands');
    files.forEach(file => {
      if (file.endsWith('.js')) require(`./modules/commands/${file}`);
    });
    fancyLog("success", 'Tiến Hành Check Lỗi', 'AUTO-CHECK');
    fancyLog("success", 'Các Modules Hiện Không Có Lỗi', 'AUTO-CHECK');
  } catch (error) {
    fancyLog("error", 'Đã Có Lỗi Tại Lệnh:', 'AUTO-CHECK');
    console.log(error);
  }
});

// ====== START BOT & LOGIN ======
function startBot(message) {
  if (message) fancyLog("info", message, "BẮT ĐẦU");
  const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "main.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true
  });
  child.on("close", (codeExit) => {
    if (codeExit != 0 || global.countRestart && global.countRestart < 5) {
      startBot("Mirai Loading - Tiến Hành Khởi Động Lại");
      global.countRestart += 1;
      return;
    } else return;
  });
  child.on("error", function (error) {
    fancyLog("error", "Đã xảy ra lỗi: " + JSON.stringify(error), "BẮT ĐẦU");
  });
};

const logacc = require('./acc.json');
async function login(){
  if(config.ACCESSTOKEN !== "") return
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
    var cookies = sessionCookies.reduce((acc, cookie) => {
      acc += `${cookie.name}=${cookie.value};`
      return acc
    }, "");
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
      var cookies = sessionCookies.reduce((acc, cookie) => {
        acc += `${cookie.name}=${cookie.value};`
        return acc
      }, "");
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
