import GruposService from "../Services/GruposService";
import type TravelInitOptions from "../Utils/ITravelInitOptions";

// prevents TS errors
declare var self: Worker;

let allowedHours: Set<number> = new Set();
let checkIntervalMs = 60_000;
let lastRunKey: string | null = null;
let intervalId: any = null;

function formatRunKey(date: Date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
}

function doCheck() {
    const now = new Date();
    const hour = now.getHours();
    if (!allowedHours.has(hour)) return;

    const runKey = formatRunKey(now);
    if (lastRunKey === runKey) return;
    lastRunKey = runKey;

    try {
        let currentShift = hour >= 12 ? "Tarde" : "Manana";
        const groupService = new GruposService();
        const groups = groupService.Get();
        // Send groups back to parent so it can perform the actual send (client lives in main thread)
        postMessage({ type: "reminder", data: { currentShift, groups } });
    } catch (err) {
        postMessage({ type: "error", error: String(err) });
    }
}

self.onmessage = (ev: MessageEvent) => {
    const msg = ev.data;
    if (!msg || !msg.type) return;

    if (msg.type === "start") {
        const opts: TravelInitOptions = msg.options ?? {};
        const defaultHours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
        
        allowedHours = new Set(opts.allowedHours ?? defaultHours);
        checkIntervalMs = opts.checkIntervalMs ?? 60_000;
        lastRunKey = null;

        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(doCheck, checkIntervalMs);
        // run once immediately
        doCheck();
    }

    if (msg.type === "stop")
        self.terminate();
};
