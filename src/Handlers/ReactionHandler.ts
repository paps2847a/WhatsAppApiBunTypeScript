import { Client, Reaction, type GroupChat } from "whatsapp-web.js";
import UsingTodayService from "../Services/UsingTodayService";
import GrpRelService from "../Services/GrpRelService";
import UsuariosService from "../Services/UsuariosService";
import GruposService from "../Services/GruposService";
import UsingToday from "../Models/UsingToday";

export default class ReactionHandler {
    public static async handleReaction(client: Client, reaction: Reaction) {

        const msg = await client.getMessageById(reaction.msgId._serialized);
        const ctx = await msg.getChat() as GroupChat;
        if (!ctx.isGroup)
            return;

        if (msg.body.includes("Recordatorio: Por favor")) {
            const _UsingTransport: UsingTodayService = new UsingTodayService();
            const _GroupRelService: GrpRelService = new GrpRelService();
            const _UserService: UsuariosService = new UsuariosService();
            const _GroupService: GruposService = new GruposService();

            let selectedGroup = _GroupService.Get("NumGrp = ?", [ctx.id._serialized]);
            if (selectedGroup.length === 0)
                return;

            //Estar pendiente de esta seccion si la id devuelta corresponde a un numero de telefono o a otro formato
            let userWhichReacted = _UserService.Get("TlfNam = ?", [reaction.senderId]);
            if (userWhichReacted.length === 0)
                return;

            let userGroupRel = _GroupRelService.Get("IdUsr = ? AND IdGrp = ?", [userWhichReacted[0]!.IdUsr, selectedGroup[0]!.IdGrp]);
            if (userGroupRel.length === 0)
                return;

            let usingTodayRecord = new UsingToday();
            usingTodayRecord.IdRel = userGroupRel[0]!.IdRel;
            usingTodayRecord.Shift = new Date().getHours() >= 12 ? "Tarde" : "Manana";
            usingTodayRecord.IsUsing = 1;

            _UsingTransport.Add(usingTodayRecord);
        }
    }
}