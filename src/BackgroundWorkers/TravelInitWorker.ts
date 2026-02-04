import type { Client } from "whatsapp-web.js";
import Logger from "../Utils/Logger";
import type TravelInitOptions from "../Utils/ITravelInitOptions";
import Randomizer from "../Utils/Randomizer";


export default class TravelInitWorker {
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

        this.worker = new Worker(workerUrl);

        this.worker.onmessage = async (ev: MessageEvent) => {
            const m = ev.data;
            if (!m || !m.type) return;

            if (m.type === "reminder") {
                const { currentShift, groups } = m.data as { currentShift: string, groups: Array<{ NumGrp: string }> };
                const message = `Recordatorio: Por favor, confirmen quiénes usarán el transporte en el turno de ${currentShift}.`;
                try {
                    for(let chatSender of groups)
                    {
                        this.clientController.sendMessage(chatSender.NumGrp, message)
                        Bun.sleep(Randomizer.getRandomDelay());
                    }
                    
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
}