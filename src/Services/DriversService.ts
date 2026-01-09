import DataHandler from "../Db/DataHandler.ts";
import Drivers from "../Models/Drivers.ts";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker.ts";

class DriversService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(Drivers.name, Object.keys(new Drivers()));

    public async Add(row: Drivers) {
        let Sentence: string = this.SentenceMaker.InsertInto(row);
        this.ExecuteSentence(Sentence);

    }

    public async Update(row: Drivers) {

    }


}   