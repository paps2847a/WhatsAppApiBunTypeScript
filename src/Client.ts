import { Client, LocalAuth, type Chat, type GroupChat } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import GruposService from './Services/GruposService';
import Grupos from './Models/Grupos';
import UsingTodayService from './Services/UsingTodayService';
import Logger from "./Utils/Logger";
import Usuarios from './Models/Usuarios';
import UsuariosService from './Services/UsuariosService';
import GrpRelService from './Services/GrpRelService';
import GrpRel from './Models/GrpRel';

//cache
const GroupsCacheData: Map<string, string> = new Map();

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
    let UnorderesGroupsData: Chat[] = await client.getChats();
    let GroupSummaries: GroupChat[] = UnorderesGroupsData.filter(chat => (chat.isGroup)
        && (chat.id._serialized != null)
        && (chat.id._serialized != "")
        && (chat.name != null)
        && (chat.name != "")
        //Verificacion de pertencia a ruta de transporte temporal
        && (chat.name.includes("botalon") || chat.name.includes("Botalon"))) as GroupChat[];

    if (GroupSummaries.length === 0)
        return;

    //Se cargan los datos iniciales de grupos, usuarios y relaciones de grupos-usuarios
    //HACE FALTA AGREGAR LOGICA DE DATOS EN BASE DE DATOS
    let _GroupService: GruposService = new GruposService();
    let _UsuarioService: UsuariosService = new UsuariosService();
    let _GroupRelService: GrpRelService = new GrpRelService();

    GroupSummaries.forEach((group) => {
        if (_GroupService.Get(`NumGrp = '${group.id._serialized}'`).length == 0) {
            let GroupDataToSave = new Grupos();
            GroupDataToSave.NumGrp = group.id._serialized;
            GroupDataToSave.DesGrp = group.name;

            _GroupService.Add(GroupDataToSave as Grupos);
        }

        group.participants.forEach(async (participant) => {
            let UserData: Usuarios[] = _UsuarioService.Get(` TlfNam = '${participant.id._serialized}'`);
            if (UserData.length == 0) {
                let NewUserData = new Usuarios();
                NewUserData.TlfNam = participant.id._serialized;
                NewUserData.IdUsr = _UsuarioService.Add(NewUserData);

                UserData = [NewUserData];
            }

            //Pueden existir multiples grupo con misma id?
            let GroupData = _GroupService.Get(` NumGrp = ${group.id._serialized}`);
            let GroupDataRel = _GroupRelService.Get(` IdUsr = ${UserData[0]?.IdUsr} AND IdGrp = ${GroupData[0]?.IdGrp}`);
            
            if (GroupDataRel.length == 0) {
                let NewGroupRel = new GrpRel();
                NewGroupRel.IdGrp = GroupData[0]?.IdGrp as number;
                NewGroupRel.IdUsr = UserData[0]?.IdUsr as number;

                _GroupRelService.Add(NewGroupRel);
            }
        });

        //La funcion no regresa la PK del registro cuandoo este es guardado
        //Hay que tener en cuenta esto
        GroupsCacheData.set(group.name, group.id._serialized);
    });

    Logger.Log('Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('message', async (msg) => {
    let ChatRegister: Chat = await msg.getChat();
    if (!ChatRegister.isGroup)
        return;

    let _UsingTransport: UsingTodayService = new UsingTodayService();
    let _UserService: UsingTodayService = new UsingTodayService();
    if (msg.body.includes("usare") || msg.body.includes("Usare")) {


    }

});

export default client;