export default interface TravelInitOptions {
    /** Hours of day (0-23) when the worker is allowed to run. */
    allowedHours?: number[];
    /** Interval to check schedule in milliseconds. Default 60 seconds. */
    checkIntervalMs?: number;
}