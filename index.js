const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const P = require("pino")
const http = require("http")

let CODE_AFFICHAGE = "CHARGEMENT... ATTENDS 15 SECONDES"

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth")
    const sock = makeWASocket({
        logger: P({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Commandant", "Chrome", "1.0"]
    })

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode("237683226535")
                CODE_AFFICHAGE = code
                console.log(`\n\n========================================`)
                console.log(`  CODE COMMANDANT: ${code}  `)
                console.log(`========================================\n\n`)
            } catch (e) {
                CODE_AFFICHAGE = "ERREUR - REDEPLOIE"
                console.log(e)
            }
        }, 8000)
    }

    sock.ev.on("creds.update", saveCreds)
    sock.ev.on("connection.update", (u) => {
        if (u.connection === "open") {
            CODE_AFFICHAGE = "✅ CONNECTÉ! C'EST FINI À VIE!"
            console.log("✅ CONNECTÉ COMMANDANT!")
        }
    })
}

const server = http.createServer((req, res) => {
    res.writeHead(200, {"Content-Type": "text/html"})
    res.end(`
    <html><body style="background:black;color:white;text-align:center;padding:20px;font-family:Arial">
    <h1 style="color:yellow">ROBOT COMMANDANT</h1>
    <div style="background:white;color:black;padding:30px;margin:20px;border-radius:20px">
    <p style="font-size:20px">TON CODE:</p>
    <h1 style="font-size:60px;letter-spacing:15px;margin:10px">${CODE_AFFICHAGE}</h1>
    </div>
    <h2 style="color:#00FF00">1. WhatsApp > Appareils liés<br>2. Lier un appareil<br>3. Lier avec numéro de téléphone<br>4. Tape ce code</h2>
    <br><br><a href="/"><button style="padding:20px 40px;font-size:25px;background:lime;border-radius:10px">CLIQUE ICI POUR RAFRAICHIR</button></a>
    <p style="margin-top:30px;color:gray">Après cette fois, tu ne toucheras plus jamais ton téléphone!</p>
    </body></html>
    `)
})

server.listen(process.env.PORT || 10000, () => console.log("Serveur OK"))
startBot()
