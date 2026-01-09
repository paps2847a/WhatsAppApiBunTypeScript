import DataHandler from "../Db/DataHandler.ts";
import UsingToday from "../Models/UsingToday.ts";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker.ts";

class UsingTodayService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(UsingToday.name, Object.keys(new UsingToday()));

    public async Add(row: UsingToday) {
        let Sentence: string = this.SentenceMaker.InsertInto(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Update(row: UsingToday) {
        let Sentence: string = this.SentenceMaker.Update(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Delete(row: UsingToday) {
        let Sentence: string = this.SentenceMaker.Delete(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Get() {
        let Sentence: string = this.SentenceMaker.Select();
        await this.ExecuteQuery(Sentence);
    }

}   