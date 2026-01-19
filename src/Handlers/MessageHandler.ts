import { Client, type Chat, type GroupChat, type Message } from 'whatsapp-web.js';
import UsingTodayService from '../Services/UsingTodayService';
import GrpRelService from '../Services/GrpRelService';
import UsuariosService from '../Services/UsuariosService';
import GruposService from '../Services/GruposService';
import UsingToday from '../Models/UsingToday';
import Logger from '../Utils/Logger';
import TlfFormatter from '../Utils/TlfFormatter';

export default class MessageHandler {
    static async handleMessage(client: Client, msg: Message) {
        const ctx = await this.getContext(client, msg);
        if (!ctx) return;

        if (await this.handleMentions(ctx)) return;
        if (await this.handleUse(ctx)) return;
        if (await this.handleNoUse(ctx)) return;
    }

    private static async getContext(client: Client, msg: Message) {
        const ChatRegister: Chat = await msg.getChat();
        if (!ChatRegister.isGroup) return null;

        const UserData = await msg.getContact();

        const _UsingTransport: UsingTodayService = new UsingTodayService();
        const _GroupRelService: GrpRelService = new GrpRelService();
        const _UserService: UsuariosService = new UsuariosService();
        const _GroupService: GruposService = new GruposService();

        const UserDataDb = _UserService.Get("TlfNam = ?", [UserData.id._serialized]);
        if (UserDataDb.length === 0) return null;

        const GroupDataDb = _GroupService.Get("NumGrp = ?", [ChatRegister.id._serialized]);
        if (GroupDataDb.length === 0) return null;

        const UsrRelGrp = _GroupRelService.Get("IdUsr = ? AND IdGrp = ?", [UserDataDb[0]!.IdUsr, GroupDataDb[0]!.IdGrp]);
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
        } as const;
    }

    private static async handleMentions(ctx: ReturnType<typeof MessageHandler.getContext> extends Promise<infer U> ? U : any) {
        const { client, msg, _UsingTransport, GroupDataDb, UsrRelGrp, UserData } = ctx as any;
        const mencioneString = await msg.getMentions();
        if (mencioneString.filter((m: any) => m.id._serialized === client.info.wid._serialized).length !== 1) return false;

        const body = msg.body.toLowerCase();
        if (body.includes("quienes van") || body.includes("quienes usaran")) {
            const currentHour = new Date().getHours();
            let currentShift = "Manana";
            if (currentHour >= 12) currentShift = "Tarde";

            const confirmedUsers = _UsingTransport.GetUsersConfirmed(GroupDataDb[0]!.IdGrp, currentShift, new Date().toJSON());

            if (confirmedUsers.length === 0) {
                await msg.reply(`No hay usuarios confirmados para el turno de la ${currentShift} hoy.`, msg.from, { sendSeen: false });
            } else {
                let response = `*Usuarios confirmados para el turno de la ${currentShift}:*\n`;
                confirmedUsers.forEach((user: any, index: number) => {
                    response += `${index + 1}. ${user.UserNam} - ${TlfFormatter.FormatNumber(user.TlfNam)}\n`;
                });
                await msg.reply(response, msg.from, { sendSeen: false });
            }
            return true;
        }
        return true; // mention but not handled further
    }

    private static async handleUse(ctx: ReturnType<typeof MessageHandler.getContext> extends Promise<infer U> ? U : any) {
        const { msg, _UsingTransport, UsrRelGrp, UserData } = ctx as any;
        if (!msg.body) return false;
        if (!msg.body.toLocaleLowerCase().includes("usare")) return false;

        const currentHour = new Date().getHours();
        let currentShift = "Manana";
        if (currentHour >= 12) currentShift = "Tarde";

        const UsingTodayData = _UsingTransport.Get("IdRel = ? AND RegDat = ? AND Shift = ?", [UsrRelGrp[0]?.IdRel, new Date().toLocaleDateString(), currentShift]);
        if (UsingTodayData.length > 0) return true;

        const NewUsingToday = new UsingToday();
        NewUsingToday.IdRel = UsrRelGrp[0]?.IdRel as number;
        NewUsingToday.IdUsing = 1;
        NewUsingToday.Shift = currentShift;
        _UsingTransport.Add(NewUsingToday);

        Logger.Log(`Usuario ${UserData.pushname} registrado para usar el servicio hoy (Turno: ${currentShift}).`);
        return true;
    }

    private static async handleNoUse(ctx: ReturnType<typeof MessageHandler.getContext> extends Promise<infer U> ? U : any) {
        const { msg, _UsingTransport, UsrRelGrp, UserData } = ctx as any;
        if (!msg.body) return false;
        if (!msg.body.toLocaleLowerCase().includes("no usare")) return false;

        const currentHour = new Date().getHours();
        let currentShift = "Manana";
        if (currentHour >= 12) currentShift = "Tarde";

        const UsingTodayData = _UsingTransport.Get("IdRel = ? AND RegDat = ? AND Shift = ?", [UsrRelGrp[0]?.IdRel, new Date().toLocaleDateString(), currentShift]);
        if (UsingTodayData.length == 0) return true;

        const NewUsingToday = UsingTodayData[0] as UsingToday;
        NewUsingToday.IsUsing = 0;
        _UsingTransport.Update(NewUsingToday);

        Logger.Log(`Usuario ${UserData.pushname} ha negado que usara el transporteservicio hoy (Turno: ${currentShift}).`);
        return true;
    }
}
