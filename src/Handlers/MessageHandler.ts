import { Client, type Chat, type GroupChat, type Message, type Contact } from 'whatsapp-web.js';
import UsingTodayService from '../Services/UsingTodayService';
import GrpRelService from '../Services/GrpRelService';
import UsuariosService from '../Services/UsuariosService';
import GruposService from '../Services/GruposService';
import UsingToday from '../Models/UsingToday';
import Usuarios from '../Models/Usuarios';
import GrpRel from '../Models/GrpRel';
import Grupos from '../Models/Grupos';
import Logger from '../Utils/Logger';
import TlfFormatter from '../Utils/TlfFormatter';
import DateUtils from '../Utils/DateUtils';

export type MessageContext = {
    client: Client;
    msg: Message;
    ChatRegister: Chat;
    UserData: Contact;
    _UsingTransport: UsingTodayService;
    _GroupRelService: GrpRelService;
    _UserService: UsuariosService;
    _GroupService: GruposService;
    UserDataDb: Usuarios[];
    GroupDataDb: Grupos[];
    UsrRelGrp: GrpRel[];
};

export default class MessageHandler {
    public static BotWhatsAppId: string = "";

    static async handleMessage(client: Client, msg: Message): Promise<void> {
        const ctx = await this.getContext(client, msg);
        if (!ctx) return;

        if (await this.handleMentions(ctx)) return;
        if (await this.handleUse(ctx)) return;
        if (await this.handleNoUse(ctx)) return;
    }

    private static async getContext(client: Client, msg: Message): Promise<MessageContext | null> {
        const ChatRegister: Chat = await msg.getChat();
        if (!ChatRegister.isGroup) return null;

        const UserData = await msg.getContact();

        const _UsingTransport: UsingTodayService = new UsingTodayService();
        const _GroupRelService: GrpRelService = new GrpRelService();
        const _UserService: UsuariosService = new UsuariosService();
        const _GroupService: GruposService = new GruposService();

        const UserDataDb = _UserService.Get("TlfNam = ?", [UserData.id._serialized]) as Usuarios[];
        if (UserDataDb.length === 0) return null;

        const GroupDataDb = _GroupService.Get("NumGrp = ?", [ChatRegister.id._serialized]) as Grupos[];
        if (GroupDataDb.length === 0) return null;

        const UsrRelGrp = _GroupRelService.Get("IdUsr = ? AND IdGrp = ?", [UserDataDb[0]!.IdUsr, GroupDataDb[0]!.IdGrp]) as GrpRel[];
        if (UsrRelGrp.length === 0) return null;

        return {
            client,
            msg,
            ChatRegister,
            UserData,
            _UsingTransport,
            _GroupRelService,
            _UserService,
            _GroupService,
            UserDataDb,
            GroupDataDb,
            UsrRelGrp
        };
    }

    private static async handleMentions(ctx: MessageContext): Promise<boolean> {
        const { client, msg, _UsingTransport, GroupDataDb, UsrRelGrp, UserData } = ctx;
        const mencioneString = await msg.getMentions();
        if (mencioneString.filter((m: any) => m.id._serialized === client.info.wid._serialized).length !== 1) return false;

        const body = msg.body.toLowerCase();
        if (body.includes("quienes van") || body.includes("quienes usaran")) {

            let currentShift = new Date().getHours() >= 12 ? "Tarde" : "Manana";
            const confirmedUsers = _UsingTransport.GetUsersConfirmed(GroupDataDb[0]!.IdGrp, currentShift);

            if (confirmedUsers.length === 0) {
                await msg.reply(`No hay usuarios confirmados para el turno de la ${currentShift} hoy.`, msg.from, { sendSeen: false });
            } else {
                let response = `*Usuarios confirmados para el turno de la ${currentShift}:*\n`;
                confirmedUsers.forEach((user: any, index: number) => {
                    response += `${index + 1}. ${user.UserNam} - ${TlfFormatter.FormatNumber(user.TlfNam)}\n`;
                });
                await msg.reply(response, msg.from, { sendSeen: false });
            }

            Logger.Log(`User ${UserData.pushname} requested confirmed users for shift ${currentShift}.`);
            return true;
        }
        return true; // mention but not handled further
    }

    private static async handleUse(ctx: MessageContext): Promise<boolean> {
        const { msg, _UsingTransport, UsrRelGrp, UserData } = ctx;
        if (!msg.body) return false;
        if (!msg.body.toLocaleLowerCase().includes("usare")) return false;

        const currentShift = new Date().getHours() >= 12 ? "Tarde" : "Manana";
        const { start, end } = DateUtils.GetTodayRange();

        const NewUsingToday = new UsingToday();
        NewUsingToday.IdRel = UsrRelGrp[0]?.IdRel as number;
        NewUsingToday.IdUsing = 1;
        NewUsingToday.Shift = currentShift;

        const wasRegistered = _UsingTransport.RegisterUsageIfNotExists(NewUsingToday, start, end);

        if (wasRegistered)
            Logger.Log(`Usuario ${UserData.pushname} registrado para usar el servicio hoy (Turno: ${currentShift}).`);
        // Opcional: Responder al usuario confirmando
        else
            Logger.Log(`El Usuario ${UserData.pushname} ya se encontraba registrado para usar el servicio hoy (Turno: ${currentShift}).`);

        return true;
    }

    //Trabajar aca, corregir errores
    private static async handleNoUse(ctx: MessageContext): Promise<boolean> {
        const { msg, _UsingTransport, UsrRelGrp, UserData } = ctx;
        if (!msg.body) return false;
        if (!msg.body.toLocaleLowerCase().includes("no usare")) return false;

        const currentShift = new Date().getHours() >= 12 ? "Tarde" : "Manana";
        const { start, end } = DateUtils.GetTodayRange();

        const NewUsingToday = new UsingToday();
        NewUsingToday.IdRel = UsrRelGrp[0]?.IdRel as number;
        NewUsingToday.IdUsing = 1;
        NewUsingToday.Shift = currentShift;

        const notUsingToday = _UsingTransport.UnRegisterUsageIfExists(NewUsingToday, start, end);
        
        //Colocar algun mensaje de loggin, ahora no se me ocurre nada

        return true;
    }
}
