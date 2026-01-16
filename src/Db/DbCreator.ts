import { file } from "bun"
import { Database } from "bun:sqlite";

export default class DbCreator {

    private Root: string = "./src/Db/";
    private DbName: string = `${this.Root}TravelOps.sqlite`;
    private DbTblesScript: string = `${this.Root}SqlDbScript.txt`;

    protected Db = new Database(this.DbName, { create: true, strict: true });

    public async CreateDb() {
        let SqliteDb = file(this.DbName);
        if (!await SqliteDb.exists())
            throw new Error("No existe script de configuracion");

        if (SqliteDb.size == 0) {
            let FileSqlText = file(this.DbTblesScript);
            if (!await FileSqlText.exists())
                throw new Error("No existe script de configuracion");

            let SqlSentenceTables = await FileSqlText.text();
            if (SqlSentenceTables.length == 0)
                throw new Error("No existe script de configuracion");

            this.Db.run(SqlSentenceTables)
        }
    }
}