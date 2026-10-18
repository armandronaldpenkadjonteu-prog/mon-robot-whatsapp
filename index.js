const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const P = require("pino");
const express = require("express");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 10000;

let pairingCode = "⏳ Chargement du code...";
let isConnected = false;

if (fs.existsSync("./auth")) {
    try { fs.rmSync("./auth", { recursive: true, force: true }); } catch(e){}
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" }),
        browser: ["ANIT-X-FINAL", "Chrome", "120.0"],
        printQRInTerminal: false
    });
    sock.ev.on("creds.update", saveCreds);

    async function genCode() {
        if (isConnected) return;
        if (!sock.authState.creds.registered) {
            try {
                pairingCode = await sock.requestPairingCode("237683226535");
                console.log("CODE:", pairingCode);
            } catch (e) {
                pairingCode = "Attends 2min puis rafraichis";
            }
        }
    }
    setTimeout(genCode, 5000);
    setInterval(genCode, 65000);

    sock.ev.on("connection.update", async (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === "open") {
            isConnected = true;
            pairingCode = "✅ CONNECTÉ!";
        }
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
            else {
                if (fs.existsSync("./auth")) fs.rmSync("./auth", { recursive: true, force: true });
                isConnected = false;
                startBot();
            }
        }
    });
}

app.get("/", (req, res) => {
    res.send(`<html><body style="margin:0;background:#000;color:#0f0;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh"><div style="border:3px solid #0f0;padding:40px;border-radius:20px;text-align:center"><h2>ANIT-X CODE SÛR</h2><h1 style="font-size:60px;background:#0f0;color:#000;padding:20px;border-radius:10px">${pairingCode}</h1><p>WhatsApp > Appareils liés > Lier avec numéro</p><button onclick="location.reload()" style="padding:10px 20px">RAFRAICHIR</button></div></body></html>`);
});
app.listen(PORT, () => { console.log("Lancé", PORT); startBot(); });
