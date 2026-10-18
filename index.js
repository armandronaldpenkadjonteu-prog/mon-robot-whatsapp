const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const qrcode = require('qrcode');
const app = express();
let qrCodeData = null;
let isConnected = false;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({ auth: state, printQRInTerminal: false });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrCodeData = await qrcode.toDataURL(qr);
            console.log('QR GENERÉ');
        }
        if (connection === 'open') {
            isConnected = true;
            qrCodeData = null;
            console.log('CONNECTÉ !!!');
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });
    sock.ev.on('creds.update', saveCreds);
}

app.get('/', async (req, res) => {
    if (isConnected) {
        res.send('<h1>✅ ANIT-X CONNECTÉ !!!</h1><p>Ton VPS gratuit tourne. Tu peux fermer la page.</p>');
    } else if (qrCodeData) {
        res.send(`<h1>Scanne ce QR avec WhatsApp</h1><p>WhatsApp > Appareils liés > Lier un appareil</p><img src="${qrCodeData}" width="300"><br><br><p>Actualise la page si le QR expire</p>`);
    } else {
        res.send('<h1>ANIT-X démarre... Actualise dans 10 secondes</h1>');
    }
});

app.listen(10000, () => { startBot(); });
