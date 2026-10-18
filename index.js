const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot WhatsApp en ligne - Commandant!');
}).listen(process.env.PORT || 10000);

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('SCANNE LE QR CODE COMMANDANT!');
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log('Reconnexion...');
        startBot();
      }
    } else if (connection === 'open') {
      console.log('BOT CONNECTE COMMANDANT!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    if (text === '.ping') {
      await sock.sendMessage(m.key.remoteJid, { text: 'Pong! Bot en ligne Commandant!' });
    }
  });
}

startBot();
