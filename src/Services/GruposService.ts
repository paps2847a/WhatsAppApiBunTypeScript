import DataHandler from "../Db/DataHandler.ts";
import Grupos from "../Models/Grupos.ts";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker.ts";

class GruposService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(Grupos.name, Object.keys(new Grupos()));

    public async Add(row: Grupos) {
        let Sentence: string = this.SentenceMaker.InsertInto(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Update(row: Grupos) {
        let Sentence: string = this.SentenceMaker.Update(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Delete(row: Grupos) {
        let Sentence: string = this.SentenceMaker.Delete(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Get() {
        let Sentence: string = this.SentenceMaker.Select();
        await this.ExecuteQuery(Sentence);
    }

}   