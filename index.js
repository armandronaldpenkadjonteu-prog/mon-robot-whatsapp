const MON_NUMERO = "237683226535";

const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot en ligne Commandant!');
}).listen(process.env.PORT || 10000, () => console.log('Serveur web allume'));

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({ auth: state, printQRInTerminal: false, browser: ["Bot Commandant","Chrome","1.0"] });
  sock.ev.on('creds.update', saveCreds);

  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(MON_NUMERO);
        console.log(`\n\n`);
        console.log(`################################`);
        console.log(`CODE COMMANDANT: ${code}`);
        console.log(`################################`);
        console.log(`\nVa sur WhatsApp > Appareils lies > Lier avec numero > Entre: ${code}\n\n`);
      } catch(e) {
        console.log("Erreur:", e.message);
      }
    }, 4000);
  }

  sock.ev.on('connection.update', (u) => {
    if (u.connection === 'open') console.log('BOT CONNECTE COMMANDANT!');
    if (u.connection === 'close' && u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot();
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]; if (!m.message) return;
    const t = m.message.conversation || m.message.extendedTextMessage?.text || '';
    if (t.toLowerCase() === '.ping') await sock.sendMessage(m.key.remoteJid, { text: 'Pong! Bot en ligne Commandant 683226535!' });
  });
}
startBot();
