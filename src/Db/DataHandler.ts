import DbEnumDir from "../Utils/DbEnumDir";
import { Database } from "bun:sqlite";


export default class DbHandler {
    private _dbInstance: Database | null = null;

    protected get Db(): Database {
        if (!this._dbInstance){
            let dirComposed = DbEnumDir.Root + DbEnumDir.DbName;
            this._dbInstance = new Database(dirComposed, { create: true, strict: true });
        }
        
        return this._dbInstance;
    }

    protected ExecuteQuery(StrQuery: string, params: any[] = []): void {
        try {
            this.Db.run(StrQuery, ...params);
        } catch (error) {
            console.error(`Error executing query: ${StrQuery}`, error);
            throw error;
        }
    }

    protected ExecuteQueryReturnElement(StrQuery: string, params: any[] = []): Object[] {
        try {
            let toExecute = this.Db.prepare(StrQuery);
            return toExecute.all(...params) as Object[];
        } catch (error) {
            console.error(`Error executing query: ${StrQuery}`, error);
            throw error;
        }
    }

    protected AddRow(StrQuery: string, params: any[] = []): number {
        try {
            //Esto estara bien?
            let result = this.Db.prepare(StrQuery).get(...params) as object;
            // Si es un insert con RETURNING, devuelve el valor. Si no, podría ser undefined.
            if (result && typeof result === 'object') {
                return Object.values(result)[0] as number;
            }
            return 0;
        } catch (error) {
            console.error(`Error adding row: ${StrQuery}`, error);
            throw error;
        }
    }

    protected GetAllRecords<T extends object>(StrQuery: string, params: any[] = []): T[] {
        try {
            const queryData = this.Db.prepare(StrQuery);
            return queryData.all(...params) as T[];
        } catch (error) {
            console.error(`Error getting records: ${StrQuery}`, error);
            throw error;
        }
    }

    public RunTransaction(action: () => void): void {
        const transaction = this.Db.transaction(action);
        transaction();
    }
}