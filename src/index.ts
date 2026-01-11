import { Client, LocalAuth, type Chat } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { write } from 'bun';

const client: Client = new Client({
    authStrategy: new LocalAuth()
});

client.on('ready', async () => {
    console.log('Client is ready!');

});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('message', async (msg) => {
    let ChatRegister: Chat = await msg.getChat();
    if(!ChatRegister.isGroup)
        return;


});

client.initialize();