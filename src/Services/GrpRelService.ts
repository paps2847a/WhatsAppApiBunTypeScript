import DataHandler from "../Db/DataHandler.ts";
import GrpRel from "../Models/GrpRel.ts";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker.ts";

class GrpRelService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(GrpRel.name, Object.keys(new GrpRel()));

    public async Add(row: GrpRel) {
        let Sentence: string = this.SentenceMaker.InsertInto(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Update(row: GrpRel) {
        let Sentence: string = this.SentenceMaker.Update(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Delete(row: GrpRel) {
        let Sentence: string = this.SentenceMaker.Delete(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Get() {
        let Sentence: string = this.SentenceMaker.Select();
        await this.ExecuteQuery(Sentence);
    }

}   