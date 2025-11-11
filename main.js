//////////////////////////////////////////////////////
//========= Require all variable need use =========//
/////////////////////////////////////////////////////
const moment = require("moment-timezone");
const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, rm } = require("fs-extra");
const { join, resolve } = require("path");
const chalk = require('chalk');
const figlet = require('figlet');
const { execSync } = require('child_process');
const logger = require("./utils/log.js");
// const login = require("fca-horizon-remastered"); 
const login = require("./includes/fca");
const axios = require("axios");
const listPackage = JSON.parse(readFileSync('./package.json')).dependencies;
const listbuiltinModules = require("module").builtinModules;

//==================================================================================//
// ⚠️ THAY THÔNG TIN CỦA MÀY VÀO ĐÂY ⚠️
const localVersion = "2.7.12"; // ⬅️ Phiên bản của file main.js này
const GITHUB_REPO_OWNER = "Kenne400k"; // ⬅️ Thay tên user/tổ chức
const GITHUB_REPO_NAME = "commands"; // ⬅️ Thay tên repo

// ⚠️ CÁC LINK ĐỂ KIỂM TRA VÀ TẢI VỀ (CHỈ CẦN 1 LINK) ⚠️
const GITHUB_MAIN_JS_URL = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/main/main.js`;
//==================================================================================//


global.client = new Object({
    commands: new Map(),
    events: new Map(),
    cooldowns: new Map(),
    eventRegistered: new Array(),
    handleSchedule: new Array(),
    handleReaction: new Array(),
    handleReply: new Array(),
    mainPath: process.cwd(),
    configPath: new String(),
  getTime: function (option) {
        switch (option) {
            case "seconds":
                return `${moment.tz("Asia/Ho_Chi_minh").format("ss")}`;
            case "minutes":
                return `${moment.tz("Asia/Ho_Chi_minh").format("mm")}`;
            case "hours":
                return `${moment.tz("Asia/Ho_Chi_minh").format("HH")}`;
            case "date": 
                return `${moment.tz("Asia/Ho_Chi_minh").format("DD")}`;
            case "month":
                return `${moment.tz("Asia/Ho_Chi_minh").format("MM")}`;
            case "year":
                return `${moment.tz("Asia/Ho_Chi_minh").format("YYYY")}`;
            case "fullHour":
                return `${moment.tz("Asia/Ho_Chi_minh").format("HH:mm:ss")}`;
            case "fullYear":
                return `${moment.tz("Asia/Ho_Chi_minh").format("DD/MM/YYYY")}`;
            case "fullTime":
                return `${moment.tz("Asia/Ho_Chi_minh").format("HH:mm:ss DD/MM/YYYY")}`;
        }
  }
});

global.data = new Object({
    threadInfo: new Map(),
    threadData: new Map(),
    userName: new Map(),
    userBanned: new Map(),
    threadBanned: new Map(),
    commandBanned: new Map(),
    threadAllowNSFW: new Array(),
    allUserID: new Array(),
    allCurrenciesID: new Array(),
    allThreadID: new Array()
});

global.utils = require("./utils");

global.nodemodule = new Object();

global.config = new Object();

global.configModule = new Object();

global.moduleData = new Array();

global.language = new Object();

//////////////////////////////////////////////////////////
//========= Find and get variable from Config =========//
/////////////////////////////////////////////////////////

var configValue;
try {
    global.client.configPath = join(global.client.mainPath, "config.json");
    configValue = require(global.client.configPath);
}
catch {
    if (existsSync(global.client.configPath.replace(/\.json/g,"") + ".temp")) {
        configValue = readFileSync(global.client.configPath.replace(/\.json/g,"") + ".temp");
        configValue = JSON.parse(configValue);
        logger.loader(`Found: ${global.client.configPath.replace(/\.json/g,"") + ".temp"}`);
    }

}

try {
    for (const key in configValue) global.config[key] = configValue[key];
}
catch { return logger.loader("Can't load file config!", "error") }

const { Sequelize, sequelize } = require("./includes/database");

writeFileSync(global.client.configPath + ".temp", JSON.stringify(global.config, null, 4), 'utf8');

/////////////////////////////////////////
//========= Load language use =========//
/////////////////////////////////////////

const langFile = (readFileSync(`${__dirname}/languages/${global.config.language || "en"}.lang`, { encoding: 'utf-8' })).split(/\r?\n|\r/);
const langData = langFile.filter(item => item.indexOf('#') != 0 && item != '');
for (const item of langData) {
    const getSeparator = item.indexOf('=');
    const itemKey = item.slice(0, getSeparator);
    const itemValue = item.slice(getSeparator + 1, item.length);
    const head = itemKey.slice(0, itemKey.indexOf('.'));
    const key = itemKey.replace(head + '.', '');
    const value = itemValue.replace(/\\n/gi, '\n');
    if (typeof global.language[head] == "undefined") global.language[head] = new Object();
    global.language[head][key] = value;
}

global.getText = function (...args) {
    const langText = global.language;    
    if (!langText.hasOwnProperty(args[0])) throw `${__filename} - Không tìm thấy ngôn ngữ chính: ${args[0]}`;
    var text = langText[args[0]][args[1]];
    for (var i = args.length - 1; i > 0; i--) {
        const regEx = RegExp(`%${i}`, 'g');
        text = text.replace(regEx, args[i + 1]);
    }
    return text;
}

try {
    var appStateFile = resolve(join(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"));
    var appState = require(appStateFile);
}
catch { return logger.loader(global.getText("mirai", "notFoundPathAppstate"), "error") }

////////////////////////////////////////////////////////////
//========= Login account and start Listen Event =========//
////////////////////////////////////////////////////////////


function onBot({ models: botModel }) {
    console.log(chalk.yellow(figlet.textSync('START BOT', { horizontalLayout: 'full' })));
    const loginData = {};
    loginData['appState'] = appState;
    login(loginData, async(loginError, loginApiData) => {
        if (loginError) return logger(JSON.stringify(loginError), `ERROR`);
        loginApiData.setOptions(global.config.FCAOption)
        writeFileSync(appStateFile, JSON.stringify(loginApiData.getAppState(), null, '\x09'))
        global.client.api = loginApiData
        global.config.version = localVersion // ⬅️ ĐÃ SỬA: Lấy version từ biến mày khai báo
        global.client.timeStart = new Date().getTime(),
            function () {
                const listCommand = readdirSync(global.client.mainPath + '/modules/commands').filter(command => command.endsWith('.js') && !command.includes('example') && !global.config.commandDisabled.includes(command));
                for (const command of listCommand) {
                    try {
                        var module = require(global.client.mainPath + '/modules/commands/' + command);
                        if (!module.config || !module.run || !module.config.commandCategory) throw new Error(global.getText('mirai', 'errorFormat'));
                        if (global.client.commands.has(module.config.name || '')) throw new Error(global.getText('mirai', 'nameExist'));

                        if (module.config.dependencies && typeof module.config.dependencies == 'object') {
                            for (const reqDependencies in module.config.dependencies) {
                                const reqDependenciesPath = join(__dirname, 'nodemodules', 'node_modules', reqDependencies);
                                try {
                                    if (!global.nodemodule.hasOwnProperty(reqDependencies)) {
                                        if (listPackage.hasOwnProperty(reqDependencies) || listbuiltinModules.includes(reqDependencies)) global.nodemodule[reqDependencies] = require(reqDependencies);
                                        else global.nodemodule[reqDependencies] = require(reqDependenciesPath);
                                    } else '';
                                } catch {
                                    var check = false;
                                    var isError;
                                    logger.loader(global.getText('mirai', 'notFoundPackage', reqDependencies, module.config.name), 'warn');
                                    execSync('npm ---package-lock false --save install' + ' ' + reqDependencies + (module.config.dependencies[reqDependencies] == '*' || module.config.dependencies[reqDependencies] == '' ? '' : '@' + module.config.dependencies[reqDependencies]), { 'stdio': 'inherit', 'env': process['env'], 'shell': true, 'cwd': join(__dirname, 'nodemodules') });
                                    for (let i = 1; i <= 3; i++) {
                                        try {
                                            require['cache'] = {};
                                            if (listPackage.hasOwnProperty(reqDependencies) || listbuiltinModules.includes(reqDependencies)) global['nodemodule'][reqDependencies] = require(reqDependencies);
                                            else global['nodemodule'][reqDependencies] = require(reqDependenciesPath);
                                            check = true;
                                            break;
                                        } catch (error) { isError = error; }
                                        if (check || !isError) break;
                                    }
                                    if (!check || isError) throw global.getText('mirai', 'cantInstallPackage', reqDependencies, module.config.name, isError);
                                }
                            }

                        }
                        if (module.config.envConfig) try {
                            for (const envConfig in module.config.envConfig) {
                                if (typeof global.configModule[module.config.name] == 'undefined') global.configModule[module.config.name] = {};
                                if (typeof global.config[module.config.name] == 'undefined') global.config[module.config.name] = {};
                                if (typeof global.config[module.config.name][envConfig] !== 'undefined') global['configModule'][module.config.name][envConfig] = global.config[module.config.name][envConfig];
                                else global.configModule[module.config.name][envConfig] = module.config.envConfig[envConfig] || '';
                                if (typeof global.config[module.config.name][envConfig] == 'undefined') global.config[module.config.name][envConfig] = module.config.envConfig[envConfig] || '';
                            }

                        } catch (error) {
                        }
                        if (module.onLoad) {
                            try {
                                const moduleData = {};
                                moduleData.api = loginApiData;
                                moduleData.models = botModel;
                                module.onLoad(moduleData);
                            } catch (_0x20fd5f) {
                                throw new Error(global.getText('mirai', 'cantOnload', module.config.name, JSON.stringify(_0x20fd5f)), 'error');
                            };
                        }
                        if (module.handleEvent) global.client.eventRegistered.push(module.config.name);
                        global.client.commands.set(module.config.name, module);

                    } catch (error) {

                    };
                }
            }(),
            function() {
                const events = readdirSync(global.client.mainPath + '/modules/events').filter(event => event.endsWith('.js') && !global.config.eventDisabled.includes(event));
                for (const ev of events) {
                    try {
                        var event = require(global.client.mainPath + '/modules/events/' + ev);
                        if (!event.config || !event.run) throw new Error(global.getText('mirai', 'errorFormat'));
                        if (global.client.events.has(event.config.name) || '') throw new Error(global.getText('mirai', 'nameExist'));
                        if (event.config.dependencies && typeof event.config.dependencies == 'object') {
                            for (const dependency in event.config.dependencies) {
                                const _0x21abed = join(__dirname, 'nodemodules', 'node_modules', dependency);
                                try {
                                    if (!global.nodemodule.hasOwnProperty(dependency)) {
                                        if (listPackage.hasOwnProperty(dependency) || listbuiltinModules.includes(dependency)) global.nodemodule[dependency] = require(dependency);
                                        else global.nodemodule[dependency] = require(_0x21abed);
                                    } else '';
                                } catch {
                                    let check = false;
                                    let isError;
                                    logger.loader(global.getText('mirai', 'notFoundPackage', dependency, event.config.name), 'warn');
                                    execSync('npm --package-lock false --save install' + dependency + (event.config.dependencies[dependency] == '*' || event.config.dependencies[dependency] == '' ? '' : '@' + event.config.dependencies[dependency]), { 'stdio': 'inherit', 'env': process['env'], 'shell': true, 'cwd': join(__dirname, 'nodemodules') });
                                    for (let i = 1; i <= 3; i++) {
                                        try {
                                            require['cache'] = {};
                                            if (global.nodemodule.includes(dependency)) break;
                                            if (listPackage.hasOwnProperty(dependency) || listbuiltinModules.includes(dependency)) global.nodemodule[dependency] = require(dependency);
                                            else global.nodemodule[dependency] = require(_0x21abed);
                                            check = true;
                                            break;
                                        } catch (error) { isError = error; }
                                        if (check || !isError) break;
                                    }
                                    if (!check || isError) throw global.getText('mirai', 'cantInstallPackage', dependency, event.config.name);
                                }
                            }

                        }
                        if (event.config.envConfig) try {
                            for (const _0x5beea0 in event.config.envConfig) {
                                if (typeof global.configModule[event.config.name] == 'undefined') global.configModule[event.config.name] = {};
                                if (typeof global.config[event.config.name] == 'undefined') global.config[event.config.name] = {};
                                if (typeof global.config[event.config.name][_0x5beea0] !== 'undefined') global.configModule[event.config.name][_0x5beea0] = global.config[event.config.name][_0x5beea0];
                                else global.configModule[event.config.name][_0x5beea0] = event.config.envConfig[_0x5beea0] || '';
                                if (typeof global.config[event.config.name][_0x5beea0] == 'undefined') global.config[event.config.name][_0x5beea0] = event.config.envConfig[_0x5beea0] || '';
                            }

                        } catch (error) {

                        }
                        if (event.onLoad) try {
                            const eventData = {};
                            eventData.api = loginApiData, eventData.models = botModel;
                            event.onLoad(eventData);
                        } catch (error) {
                            throw new Error(global.getText('mirai', 'cantOnload', event.config.name, JSON.stringify(error)), 'error');
                        }
                        global.client.events.set(event.config.name, event);

                    } catch (error) {
                    }
                }
            }()
        logger.loader(global.getText('mirai', 'finishLoadModule', global.client.commands.size, global.client.events.size)) 
        logger.loader(`Thời gian khởi động: ${((Date.now() - global.client.timeStart) / 1000).toFixed()}s`)    
        logger.loader('===== [ ' + (Date.now() - global.client.timeStart) + 'ms ] =====')
        writeFileSync(global.client['configPath'], JSON['stringify'](global.config, null, 4), 'utf8') 
        unlinkSync(global['client']['configPath'] + '.temp');       
        const listenerData = {};
        listenerData.api = loginApiData; 
        listenerData.models = botModel;
        const listener = require('./includes/listen')(listenerData);
        function listenerCallback(error, event) {
            if (error) {
                if (JSON.stringify(error).includes("601051028565049")) {
                    const form = {
                        av: api.getCurrentUserID(),
                        fb_api_caller_class: "RelayModern",
                        fb_api_req_friendly_name: "FBScrapingWarningMutation",
                        variables: "{}",
                        server_timestamps: "true",
                        doc_id: "6339492849481770",
                    };
                    api.httpPost("https://www.facebook.com/api/graphql/", form, (e, i) => {
                        const res = JSON.parse(i);
                        if (e || res.errors) return logger("Lỗi không thể xóa cảnh cáo của facebook.", "error");
                        if (res.data.fb_scraping_warning_clear.success) {
                            logger("Đã vượt cảnh cáo facebook thành công.", "[ SUCCESS ] >");
                            global.handleListen = api.listenMqtt(listenerCallback);
                            setTimeout(() => (mqttClient.end(), connect_mqtt()), 1000 * 60 * 60 * 6);
                        }
                    });
                } else {
                    return logger(global.getText("mirai", "handleListenError", JSON.stringify(error)), "error");
                }
            }
            if (["presence", "typ", "read_receipt"].some((data) => data === event?.type)) return;
            if (global.config.DeveloperMode) console.log(event);
            return listener(event);
          }
        // function listenerCallback(error, message) {
        //     if (error) return logger(global.getText('mirai', 'handleListenError', JSON.stringify(error)), 'error');
        //     if (['presence', 'typ', 'read_receipt'].some(data => data == message.type)) return;
        //     if (global.config.DeveloperMode == !![]) console.log(message);
        //     return listener(message);
        // };
        global.handleListen = loginApiData.listenMqtt(listenerCallback);
        try {
        } catch (error) {
            return 
        };


    });
}
//////////////////////////////////////////////
//========= Connecting to Database =========//
//////////////////////////////////////////////

(async () => {
    try {
        //==================================================================================//
        // 💻 LOGIC KIỂM TRA CẬP NHẬT 💻
        //==================================================================================//
        try {
            logger("Đang kiểm tra phiên bản...", "[ UPDATE ]");
            
            // 1. Lấy nội dung file main.js (dạng text) từ GitHub
            const { data: githubMainJsRaw } = await axios.get(GITHUB_MAIN_JS_URL, {
                headers: { 'Cache-Control': 'no-cache' } // Đảm bảo luôn lấy file mới nhất
            });
            
            // 2. Dùng Regex để tìm dòng "const localVersion = "..." trong file tải về
            const githubVersionMatch = githubMainJsRaw.match(/const localVersion = "([^"]+)"/);
            
            if (!githubVersionMatch || !githubVersionMatch[1]) {
                logger("Không thể tìm thấy version trong file main.js trên GitHub. Bỏ qua...", "warn");
            } else {
                const githubVersion = githubVersionMatch[1].trim();
                logger(`Phiên bản hiện tại: ${localVersion} | Phiên bản GitHub: ${githubVersion}`, "[ UPDATE ]");

                // 3. So sánh phiên bản
                if (localVersion.trim() !== githubVersion) {
                    // 4. Nếu phiên bản khác, ghi đè file main.js hiện tại
                    // (Mày đã có sẵn nội dung file trong biến 'githubMainJsRaw')
                    logger(`Phát hiện phiên bản mới: ${githubVersion}. Đang tải về...`, "[ UPDATE ]");
                    
                    writeFileSync(__filename, githubMainJsRaw, 'utf8');
                    logger("Cập nhật file main.js thành công!", "[ UPDATE ]");

                    // 5. Thoát ra để restart
                    logger("Vui lòng khởi động lại bot để áp dụng cập nhật.", "warn");
                    process.exit(0); // Tự động thoát để restart (nếu mày dùng pm2)
                } else {
                    logger("Phiên bản đã là mới nhất.", "[ UPDATE ]");
                }
            }
        } catch (error) {
            logger(`Lỗi khi kiểm tra cập nhật: ${error.message}`, "error");
            logger("Bỏ qua cập nhật và tiếp tục khởi động...", "warn");
        }
        //==================================================================================//
        // KẾT THÚC LOGIC CẬP NHẬT
        //==================================================================================//

        // Code cũ của mày: Kết nối database và khởi động bot
        // Nó sẽ chỉ chạy nếu không có cập nhật
        try {
            global.client.loggedMongoose = true;
            const { Model, DataTypes, Sequelize } = require("sequelize");
            const sequelize2 = new Sequelize({
                dialect: "sqlite",
                host: __dirname + '/LunarKrystal/datasqlite/antists.sqlite',
                logging: false
            });
            class dataModel extends Model { }
            dataModel.init({
                threadID: {
                    type: DataTypes.STRING,
                    primaryKey: true
                },
                data: {
                    type: DataTypes.JSON,
                    defaultValue: {}
                }
            }, {
                sequelize: sequelize2,
                modelName: "antists"
            });

            // connect to database
            dataModel.findOneAndUpdate = async function (filter, update) {
                const doc = await this.findOne({
            where: filter  
        });
                if (!doc)
                    return null;
                Object.keys(update).forEach(key => doc[key] = update[key]);
                await doc.save();
                return doc;
            }
            global.modelAntiSt = dataModel;
            await sequelize2.sync({ force: false });
        }
        catch (error) {
            global.client.loggedMKNOWN = false; // Lỗi chính tả ở đây, sửa từ code gốc của mày
            logger.loader('Không thể kết nối dữ liệu ANTI SETTING', '[ CONNECT ]');
            console.log(error);
        }

        await sequelize.authenticate();
        const authentication = {};
        authentication.Sequelize = Sequelize;
        authentication.sequelize = sequelize;
        const models = require('./includes/database/model')(authentication);
        const botData = {};
        botData.models = models
        onBot(botData);
    } catch (error) { logger(global.getText('mirai', 'successConnectDatabase', JSON.stringify(error)), '[ DATABASE ]'); }
})();
process.on('unhandledRejection', (err, p) => {});
