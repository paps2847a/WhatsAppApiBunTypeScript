import { file } from "bun";
import { Database } from "bun:sqlite";
import DbEnumDir from "../Utils/DbEnumDir";

export default class DbCreator {
    public static async CreateDb() {
        let dirComposed = DbEnumDir.Root + DbEnumDir.DbName;
        let dbScript = DbEnumDir.Root + DbEnumDir.DbTablesScript;

        let _instanceDb = new Database(dirComposed, { create: true, strict: true });
        _instanceDb.run("PRAGMA journal_mode = WAL;");

        // Inicializa la conexión si no existe
        const db = _instanceDb;
        
        let countTablesObj = _instanceDb!.prepare("SELECT COUNT(name) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get() as object;
        let tableNumber = Object.values(countTablesObj)[0];

        // Si el archivo está vacío, ejecutamos el script de creación
        if (tableNumber === 0) {
            let FileSqlText = file(dbScript);
            if (!await FileSqlText.exists())
                throw new Error(`No existe script de configuracion en: ${dbScript}`);

            let SqlSentenceTables = await FileSqlText.text();
            if (SqlSentenceTables.length == 0)
                throw new Error("El script de configuracion esta vacio");

            db.run(SqlSentenceTables);
            console.log("Base de datos inicializada correctamente.");
        }
    }
}