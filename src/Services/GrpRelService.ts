import DataHandler from "../Db/DataHandler";
import GrpRel from "../Models/GrpRel";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker";

class GrpRelService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(GrpRel.name, Object.keys(new GrpRel() as unknown as Record<string, unknown>));

    public Add(row: GrpRel) {
        const Sentence: string = this.SentenceMaker.InsertInto(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Update(row: GrpRel) {
        const Sentence: string = this.SentenceMaker.Update(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Delete(row: GrpRel) {
        const Sentence: string = this.SentenceMaker.Delete(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Get() {
        const Sentence: string = this.SentenceMaker.Select();
        return this.GetAllRecords<GrpRel>(Sentence);
    }

}

export default GrpRelService;