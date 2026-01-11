import DataHandler from "../Db/DataHandler";
import Viajes from "../Models/Viajes";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker";

class ViajesService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(Viajes.name, Object.keys(new Viajes() as unknown as Record<string, unknown>));

    public Add(row: Viajes) {
        const Sentence: string = this.SentenceMaker.InsertInto(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Update(row: Viajes) {
        const Sentence: string = this.SentenceMaker.Update(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Delete(row: Viajes) {
        const Sentence: string = this.SentenceMaker.Delete(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Get() {
        const Sentence: string = this.SentenceMaker.Select();
        return this.GetAllRecords<Viajes>(Sentence);
    }

}

export default ViajesService;