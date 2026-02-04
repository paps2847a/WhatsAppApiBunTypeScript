import DbEnumDir from "../Utils/DbEnumDir";
import { Database } from "bun:sqlite";
import Logger from "../Utils/Logger";

export default class DbHandler {
    // STATIC: Compartida entre todas las instancias de servicios
    private static _dbInstance: Database | null = null;

    protected get Db(): Database {
        if (!DbHandler._dbInstance) {
            let dirComposed = DbEnumDir.Root + DbEnumDir.DbName;
            DbHandler._dbInstance = new Database(dirComposed, { create: true, strict: true });
        }

        return DbHandler._dbInstance;
    }

    public static CloseConnection(): void {
        if (DbHandler._dbInstance) {
            DbHandler._dbInstance.close();
            DbHandler._dbInstance = null;
            Logger.Log("Database connection closed.");
        }
    }

    protected ExecuteQuery(StrQuery: string, params: any[] = []): void {
        try {
            this.Db.run(StrQuery, ...params);
        } catch (error) {
            Logger.LogError(`Error executing query: ${StrQuery} ${error}`);
            throw error;
        }
    }

    protected ExecuteQueryReturnElement(StrQuery: string, params: any[] = []): Object[] {
        try {
            let toExecute = this.Db.prepare(StrQuery);
            return toExecute.all(...params) as Object[];
        } catch (error) {
            Logger.LogError(`Error executing query: ${StrQuery}`);
            throw error;
        }
    }

    protected AddRow(StrQuery: string, params: any[] = []): number {
        try {
            let result = this.Db.prepare(StrQuery).get(...params) as object;
            // Si es un insert con RETURNING, devuelve el valor. Si no, podría ser undefined.
            if (result && typeof result === 'object') {
                return Object.values(result)[0] as number;
            }
            return 0;
        } catch (error) {
            Logger.LogError(`Error adding row: ${StrQuery}`);
            throw error;
        }
    }

    protected GetAllRecords<T extends object>(StrQuery: string, params: any[] = []): T[] {
        try {
            const queryData = this.Db.prepare(StrQuery);
            return queryData.all(...params) as T[];
        } catch (error) {
            Logger.LogError(`Error getting records: ${StrQuery}`);
            throw error;
        }
    }

    public RunTransaction(action: () => void): void {
        try {
            const transaction = this.Db.transaction(action);
            transaction();
        } catch (error) {
            Logger.LogError(`Error executing transaction: ${error}`);
            throw error;
        }
    }
}