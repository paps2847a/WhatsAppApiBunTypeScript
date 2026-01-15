import { Database } from "bun:sqlite";
export default class DbHandler {
    private DbName: string = "TravelOps.sqlite";
    private Db = new Database(this.DbName, { readwrite: true });

    protected ExecuteQuery(StrQuery: string): void {
        this.Db.run(StrQuery);
    }

    protected AddRow(StrQuery: string): number {
        let result = this.Db.prepare(StrQuery).get() as object;
        return Object.values(result)[0] as number;
    }

    protected GetAllRecords<T extends object>(StrQuery: string): T[] {
        const queryData = this.Db.prepare(StrQuery);
        return queryData.all() as T[];
    }
}