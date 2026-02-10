import WAWebJS, { Client, type Chat, type GroupChat } from 'whatsapp-web.js';
import GruposService from '../Services/GruposService';
import UsuariosService from '../Services/UsuariosService';
import GrpRelService from '../Services/GrpRelService';
import Grupos from '../Models/Grupos';
import Usuarios from '../Models/Usuarios';
import GrpRel from '../Models/GrpRel';
import Logger from '../Utils/Logger';
import { sleep } from 'bun';

export default class GroupSyncHandler {
    public static BotWhatsAppId: string = "";

    static async syncGroups(client: Client): Promise<void> {
        Logger.Log("Starting group synchronization...");

        // 1. Obtener chats y filtrar de forma eficiente
        const allChats: Chat[] = await client.getChats();
        const groupSummaries = allChats.filter((chat): chat is GroupChat =>
            chat.isGroup && !!chat.id._serialized && /Prueba/i.test(chat.name)
        );

        if (groupSummaries.length === 0) {
            Logger.Log("No groups found matching criteria.");
            return;
        }

        Logger.Log(`Found ${groupSummaries.length} group(s) to sync.`);

        const _GroupService = new GruposService();
        const _UsuarioService = new UsuariosService();
        const _GroupRelService = new GrpRelService();

        // 2. Caché local para evitar hits innecesarios a BD y API de WhatsApp
        const userCache = new Map<string, number>();

        for (let i = 0; i < groupSummaries.length; i++) {
            const group = groupSummaries[i] as GroupChat;
            const groupSerializedId = group.id._serialized;

            Logger.Log(`[${i + 1}/${groupSummaries.length}] Syncing group: ${group.name}`);

            // 3. Optimización de búsqueda de grupo
            let groupData = _GroupService.Get(`NumGrp = ?`, [groupSerializedId]);
            let currentGroupId: number;

            if (groupData.length === 0) {
                const newGroup = new Grupos();
                newGroup.NumGrp = groupSerializedId;
                newGroup.DesGrp = group.name;
                _GroupService.Add(newGroup);
                const freshGroupData = _GroupService.Get(`NumGrp = ?`, [groupSerializedId]);
                currentGroupId = freshGroupData[0]?.IdGrp as number;
            } else {
                currentGroupId = groupData[0]?.IdGrp as number;
            }

            if (!currentGroupId) continue;

            // 4. Filtrar participantes (excluir bot)
            const participants = group.participants.filter(p => p.id._serialized !== this.BotWhatsAppId);

            for (const participant of participants) {
                const participantId = participant.id._serialized;
                let userId: number | undefined;

                // Revisar caché primero
                if (userCache.has(participantId)) {
                    userId = userCache.get(participantId);
                } else {
                    // Revisar Base de Datos
                    const userData = _UsuarioService.Get(`TlfNam = ?`, [participantId]);

                    if (userData.length > 0) {
                        userId = userData[0]?.IdUsr as number;
                    } else {
                        // 5. Gestión de Rate Limiting y Petición a WhatsApp
                        try {
                            // Delay dinámico entre 400ms y 800ms para evitar detección de patrones
                            const jitter = Math.floor(Math.random() * 400) + 400;
                            await sleep(jitter);

                            Logger.Log(`Fetching contact info for ${participantId}...`);
                            const contact = await client.getContactById(participantId);

                            const newUser = new Usuarios();
                            newUser.TlfNam = participantId;
                            newUser.UserNam = contact.pushname || contact.name || "Sin Nombre";

                            userId = _UsuarioService.Add(newUser);
                        } catch (error) {
                            Logger.Log(`Error fetching contact ${participantId}, using fallback.`);
                            const fallbackUser = new Usuarios();
                            fallbackUser.TlfNam = participantId;
                            fallbackUser.UserNam = participantId.split('@')[0] as string;
                            userId = _UsuarioService.Add(fallbackUser);
                        }
                    }
                    // Alimentar caché
                    if (userId) userCache.set(participantId, userId);
                }

                // 6. Sincronizar Relación (solo si no existe)
                if (userId) {
                    const relExists = _GroupRelService.Get(`IdUsr = ? AND IdGrp = ?`, [userId, currentGroupId]);
                    if (relExists.length === 0) {
                        const newRel = new GrpRel();
                        newRel.IdGrp = currentGroupId;
                        newRel.IdUsr = userId;
                        newRel.IsAdm = participant.isAdmin ? 1 : 0;
                        _GroupRelService.Add(newRel);
                    }
                }
            }

            // Pequeño respiro entre grupos
            await sleep(1000);
        }

        Logger.Log("Group synchronization completed.");
    }

    static async handleGroupJoin(client: Client, notification: WAWebJS.GroupNotification): Promise<void> {
        const chat = await notification.getChat() as GroupChat;
        if (!chat.isGroup) return;

        const _GroupService: GruposService = new GruposService();
        const _UsuarioService: UsuariosService = new UsuariosService();
        const _GroupRelService: GrpRelService = new GrpRelService();

        let users = await notification.getRecipients();
        users = users.filter(x => x.id._serialized != this.BotWhatsAppId);

        if (users.length == 0) return;

        for (let user of users) {
            let userResult = _UsuarioService.Get(` TlfNam = ?`, [user.id._serialized]);
            let userWantedResult: number = 0;

            if (userResult.length === 0) {
                const NewUserData = new Usuarios();
                NewUserData.TlfNam = user.id._serialized;
                NewUserData.UserNam = user.pushname || "Sin Nombre";

                userWantedResult = _UsuarioService.Add(NewUserData);
            }

            let groupResult = _GroupService.Get(` NumGrp = ?`, [chat.id._serialized]);
            let groupWantedResult: number = 0;

            if (groupResult.length === 0) return;

            groupWantedResult = groupResult[0]?.IdGrp as number;

            let userRelResult = _GroupRelService.Get(` IdUsr = ? AND IdGrp = ?`, [userWantedResult, groupWantedResult]);
            if (userRelResult.length === 0 && groupWantedResult != 0 && userWantedResult != 0) {
                let participantRole = chat.participants.find(participant => participant.id._serialized === user.id._serialized);
                if (!participantRole) return;

                const NewGroupRel = new GrpRel();
                NewGroupRel.IdGrp = groupWantedResult;
                NewGroupRel.IdUsr = userWantedResult;
                NewGroupRel.IsAdm = participantRole.isAdmin ? 1 : 0;

                _GroupRelService.Add(NewGroupRel);
            }

            Logger.Log(`User ${user.pushname || user.id._serialized} joined group ${chat.name}.`);
        }
    }
}
