const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const qrcode = require('qrcode');
const app = express();
let qrImage = null;
let connected = false;

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ auth: state, printQRInTerminal: false });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u) => {
    const { connection, qr, lastDisconnect } = u;
    if(qr){
      qrImage = await qrcode.toDataURL(qr);
    }
    if(connection === 'open'){
      connected = true;
      qrImage = null;
    }
    if(connection === 'close'){
      if(lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut){
        start();
      }
    }
  });
}

app.get('/', (req,res) => {
  if(connected) res.send('<h1>✅ ANIT-X CONNECTE !</h1><p>Ton VPS gratuit tourne 24h/24</p>');
  else if(qrImage) res.send(`<h1>Scanne avec ton iPhone</h1><p>WhatsApp > Réglages > Appareils liés > Lier un appareil</p><img src="${qrImage}" width="350">`);
  else res.send('<h1>Démarrage... actualise dans 15s</h1>');
});

app.listen(10000, () => start());
