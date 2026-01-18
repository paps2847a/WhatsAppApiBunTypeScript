import DataHandler from "../Db/DataHandler";
import UsingToday from "../Models/UsingToday";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker";

class UsingTodayService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(UsingToday.name, Object.keys(new UsingToday() as unknown as Record<string, unknown>));

    public Add(row: UsingToday): number {
        const { query, params } = this.SentenceMaker.InsertInto(row as unknown as Record<string, unknown>);
        return this.AddRow(query, params);
    }

    public Update(row: UsingToday) {
        const { query, params } = this.SentenceMaker.Update(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(query, params);
    }

    public Delete(row: UsingToday) {
        const Sentence: string = this.SentenceMaker.Delete(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Get(WhereSentence: string = "", params: any[] = [], limit: number = 0) {
        const Sentence: string = this.SentenceMaker.Select(WhereSentence, limit);
        return this.GetAllRecords<UsingToday>(Sentence, params);
    }

}

export default UsingTodayService;