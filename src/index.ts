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
import Grupos from "./Models/Grupos";
import SqlTableQueryMaker from "./Utils/SqlTableQueryMaker";

let grpModel = new Grupos();
grpModel.IdGrp = 45;
grpModel.DesGrp = "ElPepe";
grpModel.NumGrp = "Chavez";
grpModel.IsAct = 1;
grpModel.RegDat = new Date().toLocaleDateString(); 

let instancia = new SqlTableQueryMaker(Grupos.name, Object.getOwnPropertyNames(new Grupos()));

console.log(instancia.Select());