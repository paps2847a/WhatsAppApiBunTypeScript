import DataHandler from "../Db/DataHandler";
import Drivers from "../Models/Drivers";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker";

class DriversService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(Drivers.name, Object.keys(new Drivers() as unknown as Record<string, unknown>));

    public Add(row: Drivers): number {
        const { query, params } = this.SentenceMaker.InsertInto(row as unknown as Record<string, unknown>);
        return this.AddRow(query, params);
    }

    public Update(row: Drivers) {
        const { query, params } = this.SentenceMaker.Update(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(query, params);
    }

    public Delete(row: Drivers) {
        const { query, params } = this.SentenceMaker.Delete(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(query, params);
    }

    public Get(WhereSentence: string = "", params: any[] = [], limit: number = 0) {
        const Sentence: string = this.SentenceMaker.Select(WhereSentence, limit);
        return this.GetAllRecords<Drivers>(Sentence, params);
    }

}

export default DriversService;