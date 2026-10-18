const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({ auth: state, printQRInTerminal: true })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update
    if(qr) { qrcode.generate(qr, {small: true}); console.log('SCANNE LE QR CODE COMMANDANT!') }
    if(connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if(shouldReconnect) startBot()
    }
    if(connection === 'open') console.log('BOT CONNECTE COMMANDANT!')
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if(!m.message || m.key.fromMe) return
    const text = (m.message.conversation || m.message.extendedTextMessage?.text || '').toLowerCase()
    const jid = m.key.remoteJid
    
    if(text === 'ping') await sock.sendMessage(jid, {text: 'Pong Commandant! Robot actif 🔥'})
    if(text === 'salut' || text === 'bonjour') await sock.sendMessage(jid, {text: 'Salut Commandant! Je suis ton robot WhatsApp! Envoie "ping" pour tester.'})
  })
}
startBot()
