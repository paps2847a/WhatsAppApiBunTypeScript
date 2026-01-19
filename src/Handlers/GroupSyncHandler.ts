import WAWebJS, { Client, type Chat, type GroupChat } from 'whatsapp-web.js';
import GruposService from '../Services/GruposService';
import UsuariosService from '../Services/UsuariosService';
import GrpRelService from '../Services/GrpRelService';
import Grupos from '../Models/Grupos';
import Usuarios from '../Models/Usuarios';
import GrpRel from '../Models/GrpRel';
import Logger from '../Utils/Logger';

export default class GroupSyncHandler {
    public static BotWhatsAppId: string = "";

    static async syncGroups(client: Client) {
        const UnorderedGroupsData: Chat[] = await client.getChats();

        const GroupSummaries: GroupChat[] = UnorderedGroupsData.filter((chat): chat is GroupChat =>
            chat.isGroup && !!chat.id._serialized && !!chat.name && /botalon/i.test(chat.name)
        );

        if (GroupSummaries.length === 0) return;

        const _GroupService: GruposService = new GruposService();
        const _UsuarioService: UsuariosService = new UsuariosService();
        const _GroupRelService: GrpRelService = new GrpRelService();

        for (const group of GroupSummaries) {
            const groupSerializedId = group.id._serialized;
            
            let GroupData = _GroupService.Get(`NumGrp = ?`, [groupSerializedId]);
            let currentGroupId: number;

            if (GroupData.length === 0) {
                const GroupDataToSave = new Grupos();
                GroupDataToSave.NumGrp = groupSerializedId;
                GroupDataToSave.DesGrp = group.name;
                _GroupService.Add(GroupDataToSave);
                GroupData = _GroupService.Get(`NumGrp = ?`, [groupSerializedId]);
            }

            currentGroupId = GroupData[0]?.IdGrp as number;
            if (!currentGroupId) continue;

            for (const participant of group.participants) {
                const participantId = participant.id._serialized;
                if(this.BotWhatsAppId === participantId) continue;

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

        Logger.Log("Group synchronization completed.");
    }

    static async handleGroupJoin(client: Client, notification: WAWebJS.GroupNotification) {
        const chat = await notification.getChat() as GroupChat;
        if (!chat.isGroup) return;

        const _GroupService: GruposService = new GruposService();
        const _UsuarioService: UsuariosService = new UsuariosService();
        const _GroupRelService: GrpRelService = new GrpRelService();

        const user = await notification.getContact();
        if(this.BotWhatsAppId === user.id._serialized) return;

        let userResult = _UsuarioService.Get(` TlfNam = ?`, [user.id._serialized]);
        if (userResult.length === 0) {
            const NewUserData = new Usuarios();
            NewUserData.TlfNam = user.id._serialized;
            NewUserData.UserNam = user.pushname || "Sin Nombre";
            _UsuarioService.Add(NewUserData);
            userResult = _UsuarioService.Get(` TlfNam = ?`, [user.id._serialized]);
        }

        let groupResult = _GroupService.Get(` NumGrp = ?`, [chat.id._serialized]);
        if (groupResult.length === 0) return;

        let userRelResult = _GroupRelService.Get(` IdUsr = ? AND IdGrp = ?`, [userResult[0]?.IdUsr, groupResult[0]?.IdGrp]);
        if (userRelResult.length === 0) {
            let participantRole = chat.participants.find(participant => participant.id._serialized === user.id._serialized);
            if (!participantRole) return;

            const NewGroupRel = new GrpRel();
            NewGroupRel.IdGrp = groupResult[0]?.IdGrp as number;
            NewGroupRel.IdUsr = userResult[0]?.IdUsr as number;
            NewGroupRel.IsAdm = participantRole.isAdmin ? 1 : 0;
            _GroupRelService.Add(NewGroupRel);
        }

        Logger.Log(`User ${user.pushname || user.id._serialized} joined group ${chat.name}.`);
    }
}
