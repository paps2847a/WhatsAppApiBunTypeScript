import DataHandler from "../Db/DataHandler";
import Grupos from "../Models/Grupos";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker";

class GruposService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(Grupos.name, Object.keys(new Grupos() as unknown as Record<string, unknown>));

    public Add(row: Grupos) {
        const Sentence: string = this.SentenceMaker.InsertInto(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Update(row: Grupos) {
        const Sentence: string = this.SentenceMaker.Update(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Delete(row: Grupos) {
        const Sentence: string = this.SentenceMaker.Delete(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Get(WhereSentence: string = "", limit: number = 0) {
        const Sentence: string = this.SentenceMaker.Select(WhereSentence, limit);
        return this.GetAllRecords<Grupos>(Sentence);
    }

}

export default GruposService;