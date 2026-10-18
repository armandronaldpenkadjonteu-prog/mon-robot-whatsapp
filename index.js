const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const app = express();
const PORT = process.env.PORT || 10000;
let code = "Demarrage... 30 secondes";
let connecte = false;

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({ auth: state, printQRInTerminal: false, browser: ["ANIT-X","Chrome","1.0"] });
  if(!sock.authState.creds.registered){
    setTimeout(async ()=>{
      try{
        let c = await sock.requestPairingCode("237683226535");
        code = c.match(/.{1,4}/g).join("-");
      }catch(e){ code = "Erreur, j'attends..."; }
    }, 8000);
  }
  sock.ev.on('connection.update', (u)=>{ if(u.connection==='open'){ connecte=true; code="CONNECTE !!!"; } });
  sock.ev.on('creds.update', saveCreds);
}

app.get('/', (req,res)=>{
  res.send(`<body style="background:#111;color:white;text-align:center;padding-top:50px;font-family:Arial"><h1>ANIT-X BOT EST EN LIGNE</h1><h1 style="font-size:60px;color:#25D366">${code}</h1><p>${connecte?"Connecté":"En attente du code"}</p><script>setTimeout(()=>location.reload(),10000)</script></body>`);
});

app.listen(PORT, ()=>{ console.log("LIVE"); startBot(); });
