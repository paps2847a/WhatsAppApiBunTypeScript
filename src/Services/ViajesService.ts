import DataHandler from "../Db/DataHandler.ts";
import Viajes from "../Models/Viajes.ts";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker.ts";

class ViajesService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(Viajes.name, Object.keys(new Viajes()));

    public async Add(row: Viajes) {
        let Sentence: string = this.SentenceMaker.InsertInto(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Update(row: Viajes) {
        let Sentence: string = this.SentenceMaker.Update(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Delete(row: Viajes) {
        let Sentence: string = this.SentenceMaker.Delete(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Get() {
        let Sentence: string = this.SentenceMaker.Select();
        await this.ExecuteQuery(Sentence);
    }

}   