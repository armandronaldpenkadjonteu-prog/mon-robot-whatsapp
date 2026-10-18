const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const express = require("express")
const P = require("pino")

const app = express()
const PORT = process.env.PORT || 10000
let dernierCode = "Génération en cours... patiente 10 sec"

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth")
    const sock = makeWASocket({
        logger: P({ level: "silent" }),
        auth: state,
        printQRInTerminal: false,
        browser: ["Commandant", "Chrome", "1.0"]
    })

    // Génère le code une seule fois
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode("237683226535")
                dernierCode = code
                console.log(`CODE COMMANDANT: ${code}`)
            } catch (e) {
                dernierCode = "Erreur, redéploie"
                console.log(e)
            }
        }, 5000)
    }

    sock.ev.on("creds.update", saveCreds)
    sock.ev.on("connection.update", ({ connection }) => {
        if (connection === "open") {
            dernierCode = "✅ CONNECTÉ! TU N'AS PLUS BESOIN DE FAIRE QUOI QUE CE SOIT!"
            console.log("✅ CONNECTÉ COMMANDANT!")
        }
    })
}

app.get("/", (req, res) => {
    res.send(`
    <html><body style="background:black;color:white;text-align:center;padding-top:100px;font-family:Arial">
    <h1>ROBOT COMMANDANT</h1>
    <h2 style="font-size:50px;letter-spacing:10px;color:lime">${dernierCode}</h2>
    <p>1. Ouvre WhatsApp > Appareils liés > Lier un appareil</p>
    <p>2. Clique en bas "Lier avec un numéro de téléphone"</p>
    <p>3. Tape ce code: <b>${dernierCode}</b></p>
    <p>Après ça, c'est FINI à vie!</p>
    <br><a href="/"><button style="padding:20px;font-size:20px">RAFRAICHIR LE CODE</button></a>
    </body></html>
    `)
})

app.listen(PORT, () => console.log("Serveur lancé sur port " + PORT))
startBot()
