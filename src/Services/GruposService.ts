import DataHandler from "../Db/DataHandler";
import Grupos from "../Models/Grupos";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker";

class GruposService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(Grupos.name, Object.keys(new Grupos() as unknown as Record<string, unknown>));

    public Add(row: Grupos): number {
        const { query, params } = this.SentenceMaker.InsertInto(row as unknown as Record<string, unknown>);
        return this.AddRow(query, params);
    }

    public Update(row: Grupos) {
        const { query, params } = this.SentenceMaker.Update(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(query, params);
    }

    public Delete(row: Grupos) {
        const { query, params } = this.SentenceMaker.Delete(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(query, params);
    }

    public Get(WhereSentence: string = "", params: any[] = [], limit: number = 0) {
        const Sentence: string = this.SentenceMaker.Select(WhereSentence, limit);
        return this.GetAllRecords<Grupos>(Sentence, params);
    }

}

export default GruposService;