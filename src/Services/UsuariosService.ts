import DataHandler from "../Db/DataHandler";
import Usuarios from "../Models/Usuarios";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker";

class UsuariosService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(Usuarios.name, Object.keys(new Usuarios() as unknown as Record<string, unknown>));

    public Add(row: Usuarios): number {
        const Sentence: string = this.SentenceMaker.InsertInto(row as unknown as Record<string, unknown>);
        return this.AddRow(Sentence);
    }

    public Update(row: Usuarios) {
        const Sentence: string = this.SentenceMaker.Update(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Delete(row: Usuarios) {
        const Sentence: string = this.SentenceMaker.Delete(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(Sentence);
    }

    public Get(WhereSentence: string = "", limit: number = 0) {
        const Sentence: string = this.SentenceMaker.Select(WhereSentence, limit);
        return this.GetAllRecords<Usuarios>(Sentence);
    }

}

export default UsuariosService;