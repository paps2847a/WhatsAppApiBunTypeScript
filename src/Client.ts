import { Client, LocalAuth, type Chat, type GroupChat } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import GruposService from './Services/GruposService';
import Grupos from './Models/Grupos';

const client: Client = new Client({
    authStrategy: new LocalAuth()
});

client.on('ready', async () => {
    let GroupsData: Chat[] | GroupChat[] = await client.getChats();
    GroupsData = GroupsData.filter(chat => chat.isGroup) as GroupChat[];

    let GroupSummaries: object[] = GroupsData.map(group => {
        return {
            id: group.id._serialized,
            name: group.name
        };
    });

    if(GroupSummaries.length === 0)
        return;

    let _GroupService: GruposService = new GruposService();
    // THIS NEEDS TO BE RESOLVED
    GroupSummaries.forEach(async (group) => {
        let GroupDataToSave = new Grupos();
        GroupDataToSave.NumGrp = (group as any).id;
        GroupDataToSave.DesGrp = (group as any).name;

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