const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require("@whiskeysockets/baileys");
const P = require("pino");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 10000;
let pairingCode = "Génération...";
let isConnected = false;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" }),
        browser: ["ANIT-X", "Chrome", "1.0.0"],
        printQRInTerminal: false
    });

    if (!sock.authState.creds.registered) {
        try {
            await delay(3000);
            const code = await sock.requestPairingCode("237683226535");
            pairingCode = code;
            console.log("CODE:", code);
        } catch (e) {
            console.log("Erreur code:", e);
            pairingCode = "Erreur, redémarrage...";
            setTimeout(startBot, 5000);
        }
    }

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "open") {
            isConnected = true;
            pairingCode = "CONNECTÉ ✅";
            console.log("CONNECTÉ!");
            await sock.sendMessage(sock.user.id, { text: "✅ ANIT-X CONNECTÉ À VIE! Ton robot est en ligne!" });
        }
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
            else { isConnected = false; pairingCode = "Déconnecté"; }
        }
    });
    
    // Régénère le code toutes les 40 secondes
    setInterval(async () => {
        if (!isConnected && sock.authState && !sock.authState.creds.registered) {
            try {
                const newCode = await sock.requestPairingCode("237683226535");
                pairingCode = newCode;
                console.log("NOUVEAU CODE:", newCode);
            } catch(e){}
        }
    }, 40000);
}

app.get("/", (req, res) => {
    res.send(`
    <html><head><meta http-equiv="refresh" content="20"><style>body{background:#000;color:#0f0;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column} .box{border:2px solid #0f0;padding:30px;border-radius:15px;text-align:center} h1{font-size:50px;letter-spacing:5px} .btn{background:#0f0;color:#000;padding:15px 30px;border:none;border-radius:10px;font-weight:bold;font-size:20px;cursor:pointer;margin-top:20px}</style></head><body>
    <div class="box"><h2>ANIT-X ROBOT</h2><h1>${pairingCode}</h1><p>${isConnected ? "CONNECTÉ À VIE ✅" : "Code se renouvelle tout seul toutes les 40s<br>Va sur WhatsApp > Appareils liés > Lier avec numéro"}</p><button class="btn" onclick="location.reload()">🔄 NOUVEAU CODE</button></div>
    </body></html>`);
});

app.listen(PORT, () => { startBot(); console.log("Serveur lancé"); });
