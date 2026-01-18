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
import UsingToday from './Models/UsingToday';

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

//La solicitud constante de datos de los grupos y usuarios se ha optimizado pero hay que agregar limitaciones o delay para humanizarlo
client.on('ready', async () => {
    const UnorderedGroupsData: Chat[] = await client.getChats();

    // Optimización: Filtrado más limpio y uso de Regex para case-insensitive (botalon/Botalon)
    const GroupSummaries: GroupChat[] = UnorderedGroupsData.filter((chat): chat is GroupChat =>
        chat.isGroup &&
        !!chat.id._serialized &&
        !!chat.name &&
        //Hay que acordar que los grupos de rutas siempre tendran la palabra botalon en su nombre o un elemento clave
        /botalon/i.test(chat.name)
    );

    if (GroupSummaries.length === 0)
        return;

    const _GroupService: GruposService = new GruposService();
    const _UsuarioService: UsuariosService = new UsuariosService();
    const _GroupRelService: GrpRelService = new GrpRelService();

    // Optimización: Uso de for...of en lugar de forEach para manejar mejor el flujo
    // y evitar consultas redundantes a la base de datos.
    for (const group of GroupSummaries) {
        const groupSerializedId = group.id._serialized;

        // 1. Verificar existencia del grupo (Una sola vez por grupo, fuera del loop de participantes)
        let GroupData = _GroupService.Get(`NumGrp = ?`, [groupSerializedId]);
        let currentGroupId: number;

        if (GroupData.length === 0) {
            const GroupDataToSave = new Grupos();
            GroupDataToSave.NumGrp = groupSerializedId;
            GroupDataToSave.DesGrp = group.name;
            _GroupService.Add(GroupDataToSave);

            // Recuperamos el registro recién creado para obtener su ID
            GroupData = _GroupService.Get(`NumGrp = ?`, [groupSerializedId]);
        }

        currentGroupId = GroupData[0]?.IdGrp as number;

        // Si por alguna razón no hay ID, saltamos este grupo
        if (!currentGroupId) continue;

        GroupsCacheData.set(group.name, groupSerializedId);

        // 2. Procesar participantes
        for (const participant of group.participants) {
            const participantId = participant.id._serialized;

            // Verificar Usuario
            let UserData: Usuarios[] = _UsuarioService.Get(` TlfNam = ?`, [participantId]);
            let currentUserId: number;

            if (UserData.length === 0) {
                let scrappedUserData = await client.getContactById(participant.id._serialized);

                const NewUserData = new Usuarios();
                NewUserData.TlfNam = participantId;
                NewUserData.UserNam = scrappedUserData.pushname || "Sin Nombre";

                currentUserId = _UsuarioService.Add(NewUserData);
            } else {
                currentUserId = UserData[0]?.IdUsr as number;
            }

            // Verificar Relación
            // Optimización: Usamos currentGroupId y currentUserId directamente.
            // Se eliminó la consulta redundante a _GroupService dentro de este loop.
            const GroupDataRel = _GroupRelService.Get(` IdUsr = ? AND IdGrp = ?`, [currentUserId, currentGroupId]);

            if (GroupDataRel.length === 0) {
                const NewGroupRel = new GrpRel();
                NewGroupRel.IdGrp = currentGroupId;
                NewGroupRel.IdUsr = currentUserId;
                NewGroupRel.IsAdm = participant.isAdmin ? 1 : 0;
                _GroupRelService.Add(NewGroupRel);
            }
        }
    }

    Logger.Log('Client is ready and data synced!');
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('message', async (msg) => {
    let ChatRegister: Chat = await msg.getChat();
    if (!ChatRegister.isGroup)
        return;

    let UserData = await msg.getContact();
    let _UsingTransport: UsingTodayService = new UsingTodayService();
    let _GroupRelService: GrpRelService = new GrpRelService();
    let _UserService: UsuariosService = new UsuariosService();
    let _GroupService: GruposService = new GruposService();

    let UserDataDb = _UserService.Get("TlfNam = ?", [UserData.id._serialized]);
    //TEMPORAL ESTO SE TIENE QUE CAMBIAR DESPUES
    if (UserDataDb.length === 0)
        return;

    let GroupDataDb = _GroupService.Get("NumGrp = ?", [ChatRegister.id._serialized]);
    //TEMPORAL ESTO SE TIENE QUE CAMBIAR DESPUES
    if (GroupDataDb.length === 0)
        return;

    let UsrRelGrp = _GroupRelService.Get("IdUsr = ? AND IdGrp = ?", [UserDataDb[0]!.IdUsr, GroupDataDb[0]!.IdGrp]);
    //TEMPORAL ESTO SE TIENE QUE CAMBIAR DESPUES
    if (UsrRelGrp.length === 0)
        return;

    if(msg.mentionedIds.includes(client.info.wid._serialized))
    {
        msg.reply(`Hola ${UserData.pushname}, para registrarte en el uso del transporte hoy, por favor responde con la palabra "Usare" o "usare".`);
        return;
    }

    if (msg.body.includes("usare") || msg.body.includes("Usare")) {
        let NewUsingToday = new UsingToday();
        NewUsingToday.IdRel = UsrRelGrp[0]?.IdRel as number;
        NewUsingToday.IdUsing = 1;
        _UsingTransport.Add(NewUsingToday);
        Logger.Log(`Usuario ${UserData.pushname} registrado para usar el servicio hoy.`);

        return;
    }

    

});

export default client;