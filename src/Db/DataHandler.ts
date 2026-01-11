import { Database } from "bun:sqlite";
export default class DbHandler {
    private DbName: string = "TravelOps.sqlite";
    private Db = new Database(this.DbName, { create: true });

    protected ExecuteQuery(StrQuery: string): void {
        this.Db.run(StrQuery);
    }

    protected GetAllRecords<T extends object>(StrQuery: string): T[] {
        const queryData = this.Db.prepare(StrQuery);
        return queryData.all() as T[];
    }
}