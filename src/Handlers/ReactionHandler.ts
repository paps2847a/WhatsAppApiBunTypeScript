import { Client, Reaction, type GroupChat } from "whatsapp-web.js";
import UsingTodayService from "../Services/UsingTodayService";
import GrpRelService from "../Services/GrpRelService";
import UsuariosService from "../Services/UsuariosService";
import GruposService from "../Services/GruposService";

export default class ReactionHandler
{
    public static async handleReaction(client: Client, reaction: Reaction) {

        const msg = await client.getMessageById(reaction.msgId._serialized);
        const ctx = await msg.getChat() as GroupChat;
        if (!ctx.isGroup) 
            return;

        if(msg.body.includes("Recordatorio: Por favor"))
        {
            const _UsingTransport: UsingTodayService = new UsingTodayService();
            const _GroupRelService: GrpRelService = new GrpRelService();
            const _UserService: UsuariosService = new UsuariosService();
            const _GroupService: GruposService = new GruposService();

        }
    }
}