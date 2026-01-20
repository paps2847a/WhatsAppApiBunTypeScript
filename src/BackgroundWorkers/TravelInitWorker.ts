import type { Client } from "whatsapp-web.js";
import type IBackGroundInterface from "../Utils/IBackGroundInterface";
import Logger from "../Utils/Logger";
import GruposService from "../Services/GruposService";
import type TravelInitOptions from "../Utils/ITravelInitOptions";


export default class TravelInitWorker implements IBackGroundInterface {
    private worker?: Worker;
    private clientController: Client;
    private options?: TravelInitOptions;

    constructor(cliente: Client, options?: TravelInitOptions) {
        this.clientController = cliente;
        this.options = options;
    }

    public DefineAndRegister(): void {
        // Spawn worker thread that will check DB on schedule and inform us when to send reminders
        const workerUrl = new URL("./TravelInitWorker.worker.ts", import.meta.url).href;
        Logger.Log(`TravelInitWorker: Starting worker at ${workerUrl}`);

        this.worker = new Worker(workerUrl, { type: "module" });

        this.worker.onmessage = async (ev: MessageEvent) => {
            const m = ev.data;
            if (!m || !m.type) return;

            if (m.type === "reminder") {
                const { currentShift, groups } = m.data as { currentShift: string, groups: Array<{ NumGrp: string }> };
                const message = `Recordatorio: Por favor, confirmen quiénes usarán el transporte hoy en el turno de ${currentShift}.`;
                try {
                    const promises = (groups || []).map((g: any) => this.clientController.sendMessage(g.NumGrp, message, { sendSeen: false }));
                    await Promise.allSettled(promises);
                } catch (err) {
                    Logger.Log(`TravelInitWorker send error: ${String(err)}`);
                }
            }

            if (m.type === "error") {
                Logger.Log(`TravelInitWorker worker error: ${String(m.error)}`);
            }
        };

        this.worker.onerror = (ev: ErrorEvent) => {
            Logger.Log(`TravelInitWorker encountered worker error: ${String(ev.message)}`);
        };

        // Start the worker with options
        this.worker.postMessage({ type: "start", options: this.options });
    }

    public Stop(): void {
        if (!this.worker) return;
        try {
            this.worker.postMessage({ type: "stop" });
            this.worker.terminate();
        } catch (err) {
            Logger.Log(`Error stopping TravelInitWorker: ${String(err)}`);
        }
        this.worker = undefined;
    }
}