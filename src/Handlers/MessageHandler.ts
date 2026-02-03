import { Client, type Chat, type Message, type Contact } from 'whatsapp-web.js';
import UsingTodayService from '../Services/UsingTodayService';
import GrpRelService from '../Services/GrpRelService';
import UsuariosService from '../Services/UsuariosService';
import GruposService from '../Services/GruposService';
import UsingToday from '../Models/UsingToday';
import type Usuarios from '../Models/Usuarios';
import type GrpRel from '../Models/GrpRel';
import type Grupos from '../Models/Grupos';
import Logger from '../Utils/Logger';
import TlfFormatter from '../Utils/TlfFormatter';
import DateUtils from '../Utils/DateUtils';
import SentimentValidator from '../Utils/SentimentValidator';

type MessageContext = {
    client: Client;
    msg: Message;
    chat: Chat;
    contact: Contact;
    services: {
        usingTransport: UsingTodayService;
        groupRel: GrpRelService;
        user: UsuariosService;
        group: GruposService;
    };
    user: Usuarios;
    group: Grupos;
    relation: GrpRel;
    shift: string;
    dateRange: { start: number; end: number };
};

export default class MessageHandler {
    public static BotWhatsAppId: string = "";
    
    private static readonly SHIFT_THRESHOLD = 12;
    private static readonly KEYWORDS = {
        USE: "usare",
        NO_USE: "no usare",
        WHO_GOES: ["quienes van", "quienes usaran"]
    } as const;

    static async handleMessage(client: Client, msg: Message): Promise<void> {
        const ctx = await this.getContext(client, msg);
        if (!ctx) return;

        const body = msg.body?.toLowerCase();
        if (!body) return;

        if (await this.handleMentions(ctx, body)) return;
        if (await this.handleUsageToggle(ctx, body)) return;
    }

    private static async getContext(client: Client, msg: Message): Promise<MessageContext | null> {
        const chat = await msg.getChat();
        if (!chat.isGroup) return null;

        const contact = await msg.getContact();
        
        // Instanciar servicios una sola vez
        const services = {
            usingTransport: new UsingTodayService(),
            groupRel: new GrpRelService(),
            user: new UsuariosService(),
            group: new GruposService()
        };

        // Consultas optimizadas con early return
        const [userDb] = services.user.Get("TlfNam = ?", [contact.id._serialized]) as Usuarios[];
        if (!userDb) return null;

        const [groupDb] = services.group.Get("NumGrp = ?", [chat.id._serialized]) as Grupos[];
        if (!groupDb) return null;

        const [relation] = services.groupRel.Get("IdUsr = ? AND IdGrp = ?", [userDb.IdUsr, groupDb.IdGrp]) as GrpRel[];
        if (!relation) return null;

        return {
            client,
            msg,
            chat,
            contact,
            services,
            user: userDb,
            group: groupDb,
            relation,
            shift: this.getCurrentShift(),
            dateRange: DateUtils.GetTodayRange()
        };
    }

    private static getCurrentShift(): string {
        return new Date().getHours() >= this.SHIFT_THRESHOLD ? "Tarde" : "Manana";
    }

    private static async handleMentions(ctx: MessageContext, body: string): Promise<boolean> {
        const mentions = await ctx.msg.getMentions();
        const isBotMentioned = mentions.some(m => m.id._serialized === ctx.client.info.wid._serialized);
        
        if (!isBotMentioned) return false;

        if (this.KEYWORDS.WHO_GOES.some(keyword => body.includes(keyword))) {
            await this.sendConfirmedUsers(ctx);
        }
        
        return true;
    }

    private static async sendConfirmedUsers(ctx: MessageContext): Promise<void> {
        const confirmedUsers = ctx.services.usingTransport.GetUsersConfirmed(ctx.group.IdGrp, ctx.shift);

        const response = confirmedUsers.length === 0
            ? `No hay usuarios confirmados para el turno de la ${ctx.shift} hoy.`
            : `*Usuarios confirmados para el turno de la ${ctx.shift}:*\n` +
              confirmedUsers.map((user, i) => 
                  `${i + 1}. ${user.UserNam} - ${TlfFormatter.FormatNumber(user.TlfNam)}`
              ).join('\n');

        await ctx.msg.reply(response);
        Logger.Log(`User ${ctx.contact.pushname} requested confirmed users for shift ${ctx.shift}.`);
    }

    private static async handleUsageToggle(ctx: MessageContext, body: string): Promise<boolean> {
        const response = await SentimentValidator.ValidateSentiment(body);

        const usingToday = this.createUsingToday(ctx.relation.IdRel, ctx.shift);
        if (!response) {
            ctx.services.usingTransport.UnRegisterUsageIfExists(usingToday, ctx.dateRange.start, ctx.dateRange.end);
            return true;
        }

        const wasRegistered = ctx.services.usingTransport.RegisterUsageIfNotExists(
            usingToday, 
            ctx.dateRange.start, 
            ctx.dateRange.end
        );

        const status = wasRegistered ? "registrado" : "ya se encontraba registrado";
        Logger.Log(`${wasRegistered ? "Usuario" : "El Usuario"} ${ctx.contact.pushname} ${status} para usar el servicio hoy (Turno: ${ctx.shift}).`);

        return true;
    }

    private static createUsingToday(idRel: number, shift: string): UsingToday {
        const usingToday = new UsingToday();
        usingToday.IdRel = idRel;
        usingToday.IdUsing = 1;
        usingToday.Shift = shift;
        return usingToday;
    }
}
