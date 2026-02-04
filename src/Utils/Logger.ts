import pc from "picocolors";

export default class Logger {
    public static Log(LogArgs: any) {
        console.log(pc.green(JSON.stringify(LogArgs)));
    }

    public static LogSuccess(LogArgs: any) {
        console.log(pc.greenBright(JSON.stringify(LogArgs)));
    }

    public static LogError(LogArgs: any) {
        console.log(pc.red(JSON.stringify(LogArgs)));
    }

    public static LogCriticalError(LogArgs: any) {
        console.log(pc.redBright(JSON.stringify(LogArgs)));
    }
}