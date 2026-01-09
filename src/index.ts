// import { Client, LocalAuth, type Chat } from 'whatsapp-web.js';
// import qrcode from 'qrcode-terminal';

// const client: Client = new Client({
//     authStrategy: new LocalAuth()
// });

// client.on('ready', () => {
//     console.log('Client is ready!');
// });

// client.on('qr', qr => {
//     qrcode.generate(qr, {small: true});
// });

// client.on('message', async (msg) => {
//     let ChatRegister: Chat = await msg.getChat();
//     if(!ChatRegister.isGroup)
//         return;

// });

// client.initialize();

import StringBuilder from "./Utils/StringBuilder.ts";

let data = new StringBuilder("Hola");
data.Append(" Como estas ");
data.Append("Espero que bien causa");

console.log(data.ToString());