import { Client, LocalAuth, type Chat, type GroupChat } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import GruposService from './Services/GruposService';
import Grupos from './Models/Grupos';

const client: Client = new Client({
    authStrategy: new LocalAuth(),
    //ESTE ES EL TIPO DE CONFIGURACION QUE AGARRA PUPPETEER EN UBUNTU, EXISTE UN PROBLEMA CON EL SANDBOX
    //DEBIDO A REESTRICCIONES DE APPARMOR EN UBUNTU 23.10+ EN ADELANTE
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    },
});

client.on('ready', async () => {
    let GroupSummaries: Chat[] | GroupChat[] = await client.getChats();
    GroupSummaries = GroupSummaries.filter(chat => (chat.isGroup) 
    && (chat.id._serialized != null) 
    && (chat.id._serialized != "") 
    && (chat.name != null) 
    && (chat.name != "")) as GroupChat[];

    if (GroupSummaries.length === 0)
        return;

    let _GroupService: GruposService = new GruposService();
    GroupSummaries.forEach((group) => {
        if (_GroupService.Get(` NumGrp = ${group.id._serialized}`).length == 0) {
            let GroupDataToSave = new Grupos();
            GroupDataToSave.NumGrp = group.id._serialized;
            GroupDataToSave.DesGrp = group.name;

            _GroupService.Add(GroupDataToSave as Grupos);
        }
    });

    console.log('Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('message', async (msg) => {
    let ChatRegister: Chat = await msg.getChat();
    if (!ChatRegister.isGroup)
        return;

});

export default client;