import { Client, Events, LocalAuth  } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import GroupSyncHandler from './Handlers/GroupSyncHandler';
import MessageHandler from './Handlers/MessageHandler';
import ReactionHandler from './Handlers/ReactionHandler';

const client: Client = new Client({
    authStrategy: new LocalAuth(),
    //ESTE ES EL TIPO DE CONFIGURACION QUE AGARRA PUPPETEER EN UBUNTU, EXISTE UN PROBLEMA CON EL SANDBOX
    //DEBIDO A REESTRICCIONES DE APPARMOR EN UBUNTU 23.10+ EN ADELANTE
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

//Agregar evento para verificar reacciones a mensajes sobre participacion en transporte
client.on('message_reaction', async (reaction) => {
    await ReactionHandler.handleReaction(client, reaction);
});

client.on(Events.QR_RECEIVED, qr => {
    qrcode.generate(qr, { small: true });
});

//La solicitud constante de datos de los grupos y usuarios se ha optimizado pero hay que agregar limitaciones o delay para humanizarlo
client.on(Events.READY, async () => {
    GroupSyncHandler.BotWhatsAppId = client.info.wid._serialized;
    MessageHandler.BotWhatsAppId = client.info.wid._serialized;

    // message sync / other startup tasks can be placed here
    // leave logging to existing utils
    await GroupSyncHandler.syncGroups(client);
});

client.on(Events.GROUP_JOIN, async (notification) => {
    await GroupSyncHandler.handleGroupJoin(client, notification);
});

client.on(Events.MESSAGE_RECEIVED, async (msg) => {
    await MessageHandler.handleMessage(client, msg);
});

export default client;