import DataHandler from "../Db/DataHandler";
import GrpRel from "../Models/GrpRel";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker";

class GrpRelService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(GrpRel.name, Object.keys(new GrpRel() as unknown as Record<string, unknown>));

    public Add(row: GrpRel): number {
        const { query, params } = this.SentenceMaker.InsertInto(row as unknown as Record<string, unknown>);
        return this.AddRow(query, params);
    }

    public Update(row: GrpRel) {
        const { query, params } = this.SentenceMaker.Update(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(query, params);
    }

    public Delete(row: GrpRel) {
        const { query, params } = this.SentenceMaker.Delete(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(query, params);
    }

    public Get(WhereSentence: string = "", params: any[] = [], limit: number = 0) {
        const Sentence: string = this.SentenceMaker.Select(WhereSentence, limit);
        return this.GetAllRecords<GrpRel>(Sentence, params);
    }

}

export default GrpRelService;