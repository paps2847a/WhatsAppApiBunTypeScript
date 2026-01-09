import { Database } from "bun:sqlite";
import { file } from "bun";

export default class DbHandler
{
    private DbName: string = "TravelOps.sqlite";
    public Db = new Database(this.DbName, { create: true });

    public async ExecuteSentence(StrQuery: string): Promise<void>
    {
        this.Db.run(StrQuery);
    }
}