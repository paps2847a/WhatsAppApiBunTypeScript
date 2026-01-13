import { Client, LocalAuth, type Chat, type GroupChat } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import GruposService from './Services/GruposService';
import Grupos from './Models/Grupos';
import type GroupDTO from './types/GroupDTO';

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
    let GroupsData: Chat[] | GroupChat[] = await client.getChats();
    GroupsData = GroupsData.filter(chat => chat.isGroup) as GroupChat[];

    let GroupSummaries: GroupDTO[] = GroupsData.map(group => {
        return {
            NumberStr: group.id._serialized,
            NameStr: group.name
        };
    });

    if(GroupSummaries.length === 0)
        return;

    let _GroupService: GruposService = new GruposService();
    GroupSummaries.forEach(async (group) => {
        let GroupDataToSave = new Grupos();
        GroupDataToSave.NumGrp = group.NumberStr;
        GroupDataToSave.DesGrp = group.NameStr;

        _GroupService.Add(GroupDataToSave as Grupos);
    });

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

export default client;