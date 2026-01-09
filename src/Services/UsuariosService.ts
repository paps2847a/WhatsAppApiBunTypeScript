import DataHandler from "../Db/DataHandler.ts";
import Usuarios from "../Models/Usuarios.ts";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker.ts";

class UsuariosService extends DataHandler {
    private SentenceMaker: SqlTableQueryMaker = new SqlTableQueryMaker(Usuarios.name, Object.keys(new Usuarios()));

    public async Add(row: Usuarios) {
        let Sentence: string = this.SentenceMaker.InsertInto(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Update(row: Usuarios) {
        let Sentence: string = this.SentenceMaker.Update(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Delete(row: Usuarios) {
        let Sentence: string = this.SentenceMaker.Delete(row);
        await this.ExecuteQuery(Sentence);
    }

    public async Get() {
        let Sentence: string = this.SentenceMaker.Select();
        await this.ExecuteQuery(Sentence);
    }

}   