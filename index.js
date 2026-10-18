const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const P = require("pino");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 10000;

let code = "Patiente... génération du code...";
let connected = false;

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const sock = makeWASocket({ auth: state, logger: P({level:"silent"}), browser: ["ANIT-X","Chrome","1.0"] });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                code = await sock.requestPairingCode("237683226535");
                console.log("CODE:", code);
            } catch(e){ code = "Erreur, relance..."; }
        }, 3000);
    }

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", (u) => {
        if (u.connection === "open") {
            connected = true;
            code = "✅ CONNECTÉ À VIE!";
        }
        if (u.connection === "close" && u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
            start();
        }
    });
}

app.get("/", (req,res) => {
    res.send(`<body style="background:#000;color:#0f0;display:flex;justify-content:center;align-items:center;height:100vh;font-family:monospace"><div style="border:3px solid #0f0;padding:40px;border-radius:20px;text-align:center"><h2>ANIT-X BOT</h2><h1 style="font-size:60px;letter-spacing:10px">${code}</h1><p>${connected ? "C'EST FINI! TU PEUX FERMER!" : "1. WhatsApp > 3 points > Appareils liés<br>2. Lier un appareil<br>3. En bas: Lier avec numéro<br>4. Tape le code"}</p><button onclick="location.reload()" style="padding:15px;background:#0f0;border:none;font-weight:bold;border-radius:10px">NOUVEAU CODE</button></div></body>`);
});

app.listen(PORT, start);
