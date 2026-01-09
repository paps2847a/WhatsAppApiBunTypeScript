import { Database } from "bun:sqlite";
import Grupos from "../Models/Grupos";

export default class DbHandler
{
    private DbName: string = "TravelOps.sqlite";
    private Db = new Database(this.DbName, { create: true });

    protected async AddAsync(StrQuery: string): Promise<void>
    {
        let data = this.Db.query(StrQuery);
        
    }

    protected async GetAllRecordsAsync<T extends object>(StrQuery: string): Promise<T[]>
    {
        let queryData = this.Db.prepare(StrQuery);
        return queryData.all() as T[];
    }
}