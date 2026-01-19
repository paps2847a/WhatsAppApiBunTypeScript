export default class TlfFormatter
{
    public static FormatNumber(tlf: string): string
    {
        return tlf.replace(/^58|@c\.us$/g, (match) => match === "58" ? "0" : "");
    }
}