const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const P = require("pino");
const express = require("express");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 10000;

let pairingCode = "⏳ Attente... 30s";
let isConnected = false;

// Supprime l'ancienne session bloquée
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

    // Génère un nouveau code toutes les 60 secondes si pas connecté
    async function genCode() {
        if (isConnected) return;
        if (!sock.authState.creds.registered) {
            try {
                pairingCode = await sock.requestPairingCode("237683226535");
                console.log("🔥 CODE SÛR:", pairingCode);
            } catch (e) {
                console.log("Erreur gen code:", e.message);
                pairingCode = "❌ Bloqué 10min, attends...";
                setTimeout(genCode, 60000);
            }
        }
    }

    setTimeout(genCode, 5000);
    setInterval(genCode, 65000);

    sock.ev.on("connection.update", async (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === "open") {
            isConnected = true;
            pairingCode = "✅ CONNECTÉ À VIE! TU PEUX FERMER";
            console.log("CONNECTÉ!");
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
    res.send(`
    <html><head><meta http-equiv="refresh" content="20"></head>
    <body style="margin:0;background:#000;color:#00ff00;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh">
    <div style="border:4px solid #00ff00;padding:40px;border-radius:30px;text-align:center;box-shadow:0 0 30px #00ff00">
    <h2 style="letter-spacing:3px">ANIT-X CODE SÛR</h2>
    <h1 style="font-size:70px;margin:20px 0;letter-spacing:15px;color:white;background:#00ff00;color:black;padding:20px;border-radius:15px">${pairingCode}</h1>
    <p style="font-size:18px">${isConnected ? "C'EST FAIT COMMANDANT! FERME CETTE PAGE!" : "WhatsApp > Paramètres > Appareils liés > Lier un appareil > Lier avec numéro<br>Entre ce code en 30 secondes"}</p>
    <button onclick="location.reload()" style="margin-top:20px;padding:15px 30px;background:white;color:black;font-weight:bold;border:none;border-radius:10px;font-size:18px">RAFRAICHIR LE CODE</button>
    <p style="margin-top:15px;font-size:12px;opacity:0.7">Le code change seul toutes les 60s</p>
    </div></body></html>
    `);
});

app.listen(PORT, () => {
    console.log("Serveur lancé sur", PORT);
    startBot();
});
