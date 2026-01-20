import DataHandler from "../Db/DataHandler";
import Usuarios from "../Models/Usuarios";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker";

class UsuariosService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(Usuarios.name, Object.keys(new Usuarios() as unknown as Record<string, unknown>));

    public Add(row: Usuarios): number {
        const { query, params } = this.SentenceMaker.InsertInto(row as unknown as Record<string, unknown>);
        return this.AddRow(query, params);
    }

    public Update(row: Usuarios) {
        const { query, params } = this.SentenceMaker.Update(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(query, params);
    }

    public Delete(row: Usuarios) {
        const { query, params } = this.SentenceMaker.Delete(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(query, params);
    }

    public Get(WhereSentence: string = "", params: any[] = [], limit: number = 0) {
        const Sentence: string = this.SentenceMaker.Select(WhereSentence, limit);
        return this.GetAllRecords<Usuarios>(Sentence, params);
    }

    public CheckIfUserHasName(TlfNam: string) : boolean
    {
        let resultData = this.ExecuteQueryReturnElement("SELECT UserNam Is '' AS ResultCheck FROM Usuarios WHERE TlfNam = ?", [TlfNam]);
        if(resultData.length === 0)
            return false;

        let ObjectedResult = resultData[0] as { ResultCheck: number };
        return ObjectedResult.ResultCheck === 0;
    }

}

export default UsuariosService;