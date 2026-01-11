import DataHandler from "../Db/DataHandler";
import Drivers from "../Models/Drivers";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker";

class DriversService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(Drivers.name, Object.keys(new Drivers() as unknown as Record<string, unknown>));

    public Add(row: Drivers) {
        const Sentence: string = this.SentenceMaker.InsertInto(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Update(row: Drivers) {
        const Sentence: string = this.SentenceMaker.Update(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Delete(row: Drivers) {
        const Sentence: string = this.SentenceMaker.Delete(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Get() {
        const Sentence: string = this.SentenceMaker.Select();
        return this.GetAllRecords<Drivers>(Sentence);
    }

}

export default DriversService;