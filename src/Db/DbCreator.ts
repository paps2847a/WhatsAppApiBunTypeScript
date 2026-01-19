import { file } from "bun"
import { Database } from "bun:sqlite";

export default class DbCreator {

    private static Root: string = "./src/Db/";
    private static DbName: string = `${DbCreator.Root}TravelOps.sqlite`;
    private static DbTablesScript: string = `${DbCreator.Root}SqlDbScript.txt`;
    private static _dbInstance: Database | null = null;

    protected get Db(): Database {
        if (!DbCreator._dbInstance) {
            DbCreator._dbInstance = new Database(DbCreator.DbName, { create: true, strict: true });
            DbCreator._dbInstance.run("PRAGMA journal_mode = WAL;");
        }
        return DbCreator._dbInstance;
    }

    public async CreateDb() {
        // Inicializa la conexión si no existe
        const db = this.Db;
        
        let countTablesObj = DbCreator._dbInstance!.prepare("SELECT COUNT(name) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get() as object;
        let tableNumber = Object.values(countTablesObj)[0];

        // Si el archivo está vacío, ejecutamos el script de creación
        if (tableNumber === 0) {
            let FileSqlText = file(DbCreator.DbTablesScript);
            if (!await FileSqlText.exists())
                throw new Error(`No existe script de configuracion en: ${DbCreator.DbTablesScript}`);

            let SqlSentenceTables = await FileSqlText.text();
            if (SqlSentenceTables.length == 0)
                throw new Error("El script de configuracion esta vacio");

            db.run(SqlSentenceTables);
            console.log("Base de datos inicializada correctamente.");
        }
    }

    public async dispose(): Promise<void> {
        if (DbCreator._dbInstance) {
            try {
                // bun:sqlite Database has a close() method
                DbCreator._dbInstance.close();
            } catch (err) {
                // best-effort close
                console.error("Error closing DB:", err);
            } finally {
                DbCreator._dbInstance = null;
            }
        }
    }
}