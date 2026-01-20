import DataHandler from "../Db/DataHandler";
import Viajes from "../Models/Viajes";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker";

class ViajesService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(Viajes.name, Object.keys(new Viajes() as unknown as Record<string, unknown>));

    public Add(row: Viajes): number {
        const { query, params } = this.SentenceMaker.InsertInto(row as unknown as Record<string, unknown>);
        return this.AddRow(query, params);
    }

    public Update(row: Viajes) {
        const { query, params } = this.SentenceMaker.Update(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(query, params);
    }

    public Delete(row: Viajes) {
        const { query, params } = this.SentenceMaker.Delete(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(query, params);
    }

    public Get(WhereSentence: string = "", params: any[] = [], limit: number = 0) {
        const Sentence: string = this.SentenceMaker.Select(WhereSentence, limit);
        return this.GetAllRecords<Viajes>(Sentence, params);
    }

}

export default ViajesService;