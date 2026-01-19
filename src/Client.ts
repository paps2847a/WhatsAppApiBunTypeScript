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
import TlfFormatter from './Utils/TlfFormatter';

const client: Client = new Client({
    authStrategy: new LocalAuth(),
    //ESTE ES EL TIPO DE CONFIGURACION QUE AGARRA PUPPETEER EN UBUNTU, EXISTE UN PROBLEMA CON EL SANDBOX
    //DEBIDO A REESTRICCIONES DE APPARMOR EN UBUNTU 23.10+ EN ADELANTE
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
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

        // 2. Procesar participantes
        for (const participant of group.participants) {
            const participantId = participant.id._serialized;

            // Verificar Usuario
            let UserData: Usuarios[] = _UsuarioService.Get(` TlfNam = ?`, [participantId]);
            let currentUserId: number;

            if (UserData.length === 0) {
                //Estar pendiente con esta seccion, quien sabe si wasap se vuelve loco
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

client.on('group_join', async (notification) => {
    const chat = await notification.getChat() as GroupChat;
    if(!chat.isGroup)
        return;

    const _GroupService: GruposService = new GruposService();
    const _UsuarioService: UsuariosService = new UsuariosService();
    const _GroupRelService: GrpRelService = new GrpRelService();

    // User has joined or been added to the group.
    const user = await notification.getContact();

    let userResult = _UsuarioService.Get(` TlfNam = ?`, [user.id._serialized]);
    if (userResult.length === 0) {
        const NewUserData = new Usuarios();
        NewUserData.TlfNam = user.id._serialized;
        NewUserData.UserNam = user.pushname || "Sin Nombre";
        _UsuarioService.Add(NewUserData);
    }

    let groupResult = _GroupService.Get(` NumGrp = ?`, [chat.id._serialized]);
    if (groupResult.length === 0)
        return;

    let userRelResult = _GroupRelService.Get(` IdUsr = ? AND IdGrp = ?`, [userResult[0]?.IdUsr, groupResult[0]?.IdGrp]);
    if (userRelResult.length === 0) {
        let participantRole = chat.participants.find(participant => participant.id._serialized === user.id._serialized);
        if(!participantRole)
            return;

        const NewGroupRel = new GrpRel();
        NewGroupRel.IdGrp = groupResult[0]?.IdGrp as number;
        NewGroupRel.IdUsr = userResult[0]?.IdUsr as number;
        NewGroupRel.IsAdm = participantRole.isAdmin ? 1 : 0;
        _GroupRelService.Add(NewGroupRel);
    }

    Logger.Log(`${user.pushname} se unio a ${chat.name}`);
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

    //Se verifica si se hace mencion al bot
    //Creo que esto puede ser un peo con el rendimiento
    let mencioneString = await msg.getMentions();
    if (mencioneString.filter(mencion => mencion.id._serialized === client.info.wid._serialized).length == 1) {
        
        if (msg.body.toLowerCase().includes("quienes van") || msg.body.toLowerCase().includes("quienes usaran")) {
            // Determinar el turno basado en la hora actual
            const currentHour = new Date().getHours();
            let currentShift = "Manana"; // Por defecto
            if (currentHour >= 12) {
                currentShift = "Tarde";
            }

            const confirmedUsers = _UsingTransport.GetUsersConfirmed(GroupDataDb[0]!.IdGrp, currentShift, new Date().toJSON());

            if (confirmedUsers.length === 0) {
                await msg.reply(`No hay usuarios confirmados para el turno de la ${currentShift} hoy.`, msg.from, { sendSeen: false });
            } else {
                let response = `*Usuarios confirmados para el turno de la ${currentShift}:*\n`;
                confirmedUsers.forEach((user, index) => {
                    response += `${index + 1}. ${user.UserNam} - ${TlfFormatter.FormatNumber(user.TlfNam)}\n`;
                });
                await msg.reply(response, msg.from, { sendSeen: false });
            }
            return;
        }

        return;
    }

    if (msg.body.toLocaleLowerCase().includes("usare")) {

        // Determinar el turno basado en la hora actual
        const currentHour = new Date().getHours();
        let currentShift = "Manana"; // Por defecto
        if (currentHour >= 12) {
            currentShift = "Tarde";
        }

        let UsingTodayData = _UsingTransport.Get("IdRel = ? AND RegDat = ? AND Shift = ?", [UsrRelGrp[0]?.IdRel, new Date().toLocaleDateString(), currentShift]);
        if (UsingTodayData.length > 0)
            return; //Ya esta registrado

        let NewUsingToday = new UsingToday();
        NewUsingToday.IdRel = UsrRelGrp[0]?.IdRel as number;
        NewUsingToday.IdUsing = 1;
        NewUsingToday.Shift = currentShift;
        _UsingTransport.Add(NewUsingToday);
        
        Logger.Log(`Usuario ${UserData.pushname} registrado para usar el servicio hoy (Turno: ${currentShift}).`);

        return;
    }

    if (msg.body.toLocaleLowerCase().includes("no usare")) {

        // Determinar el turno basado en la hora actual
        const currentHour = new Date().getHours();
        let currentShift = "Manana"; // Por defecto
        if (currentHour >= 12) {
            currentShift = "Tarde";
        }

        let UsingTodayData = _UsingTransport.Get("IdRel = ? AND RegDat = ? AND Shift = ?", [UsrRelGrp[0]?.IdRel, new Date().toLocaleDateString(), currentShift]);
        if (UsingTodayData.length == 0)
            return; //No hay registro previo

        let NewUsingToday = UsingTodayData[0] as UsingToday;
        NewUsingToday.IsUsing = 0;
        _UsingTransport.Update(NewUsingToday);
        
        Logger.Log(`Usuario ${UserData.pushname} ha negado que usara el transporteservicio hoy (Turno: ${currentShift}).`);

        return;
    }
});

export default client;