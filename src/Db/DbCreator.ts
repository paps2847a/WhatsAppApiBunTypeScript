import { file } from "bun";
import { Database } from "bun:sqlite";
import DbEnumDir from "../Utils/DbEnumDir";
import Logger from "../Utils/Logger";

export default class DbCreator {
    public static async CreateDb(): Promise<void> {
        let dirComposed = DbEnumDir.DbName;

        let _instanceDb = new Database(dirComposed, { create: true, strict: true });
        _instanceDb.run("PRAGMA journal_mode = WAL;");
        
        let countTablesObj = _instanceDb!.prepare("SELECT COUNT(name) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get() as object;
        let tableNumber = Object.values(countTablesObj)[0] as number;

        // Si el archivo está vacío, ejecutamos el script de creación
        if (tableNumber === 0) {
            let dirTable = DbEnumDir.DbTablesScript;

            let FileSqlText = file(dirTable);
            if (!await FileSqlText.exists())
                throw new Error(`No existe script de configuracion en: ${dirTable}`);

            let SqlSentenceTables = await FileSqlText.text();
            if (SqlSentenceTables.length == 0)
                throw new Error("El script de configuracion esta vacio");
            
            _instanceDb.run(SqlSentenceTables);
            Logger.Log("Base de datos inicializada correctamente.");
        }
    }
}