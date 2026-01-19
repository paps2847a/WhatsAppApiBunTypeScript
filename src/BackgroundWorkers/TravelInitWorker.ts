import type { Client } from "whatsapp-web.js";
import type IBackGroundInterface from "../Utils/IBackGroundInterface";
import Logger from "../Utils/Logger";
import GruposService from "../Services/GruposService";
import type TravelInitOptions from "../Utils/ITravelInitOptions";


export default class TravelInitWorker implements IBackGroundInterface {
    private allowedHours: Set<number>;
    private checkIntervalMs: number;
    private lastRunKey: string | null = null;
    private clientController: Client;
    private groupService: GruposService;

    constructor(cliente: Client, groupSvrc: GruposService, options?: TravelInitOptions) {
        const defaultHours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
        
        this.allowedHours = new Set(options?.allowedHours ?? defaultHours);
        this.checkIntervalMs = options?.checkIntervalMs ?? 60_000; // 1 minute
        this.clientController = cliente;
        this.groupService = groupSvrc;
    }

    DefineAndRegister(): void {
        setInterval(() => {
            const now = new Date();
            const hour = now.getHours();

            if (!this.allowedHours.has(hour)) return; // not within allowed hours

            // Prevent multiple runs within the same minute (or same hour if desired)
            const runKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${hour}`;
            if (this.lastRunKey === runKey) return;
            this.lastRunKey = runKey;

            try {
                let currentShift = "Manana";
                if (hour >= 12) 
                    currentShift = "Tarde";

                let GroupsTosend = this.groupService.Get();
                for(let item of GroupsTosend)
                {
                    //this.clientController.sendMessage(item.NumGrp as string, `Recordatorio: Por favor, confirmen quiénes usarán el transporte hoy en el turno de ${currentShift}.`);
                    Logger.Log(`Mensaje enviado al grupo ${item.DesGrp} para el turno de ${currentShift}.`);
                }

                Logger.Log(`TravelInitWorker is running at ${now.toLocaleString()}...`);
                // TODO: place the actual job logic here (e.g., init travel data, DB checks, etc.)
            } catch (err) {
                Logger.Log(`TravelInitWorker error: ${String(err)}`);
            }
        }, this.checkIntervalMs);
    }
}