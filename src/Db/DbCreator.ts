import { file } from "bun";
import { Database } from "bun:sqlite";
import DbEnumDir from "../Utils/DbEnumDir";
import Logger from "../Utils/Logger";

export default class DbCreator {
    public static async CreateDb(): Promise<void> {
        const dbPath = DbEnumDir.DbName;
        let db: Database | null = null;

        try {
            // 1. Inicializar DB con modo estricto
            db = new Database(dbPath, { create: true, strict: true });
            
            // 2. Optimización de rendimiento
            db.exec("PRAGMA journal_mode = WAL;");
            db.exec("PRAGMA synchronous = NORMAL;");

            // 3. Verificar si existen tablas (excluyendo tablas internas de sqlite)
            const result = db.query("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get() as { count: number };
            
            if (result.count === 0) {
                Logger.Log("Database empty. Starting initialization...");

                const scriptPath = DbEnumDir.DbTablesScript;
                const scriptFile = file(scriptPath);

                if (!await scriptFile.exists()) {
                    throw new Error(`Configuration script not found at: ${scriptPath}`);
                }

                const sqlContent = await scriptFile.text();
                if (!sqlContent.trim()) {
                    throw new Error("Configuration script is empty.");
                }

                // 4. Ejecución atómica (Transacción)
                // Usamos una función transaccional para asegurar integridad
                const initDb = db.transaction((sql: string) => {
                    db!.run(sql); // exec permite múltiples sentencias en bun:sqlite
                    return true;
                });

                initDb(sqlContent);
                Logger.Log("Database initialized successfully with schema.");
            }
        } catch (error) {
            Logger.Log(`Critical error during DB creation: ${error instanceof Error ? error.message : error}`);
            throw error; 
        } finally {
            // 5. Cerrar la conexión temporal para evitar archivos lock (.db-shm, .db-wal) persistentes
            if (db) {
                db.close();
            }
        }
    }
}