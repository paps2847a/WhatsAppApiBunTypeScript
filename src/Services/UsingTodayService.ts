import DataHandler from "../Db/DataHandler";
import UsingToday from "../Models/UsingToday";
import SqlTableQueryMaker from "../Utils/SqlTableQueryMaker";
import DateUtils from "../Utils/DateUtils";

class UsingTodayService extends DataHandler {
    // Se instancia con un objeto UsingToday para obtener las claves, incluyendo 'Shift'
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
        const { query, params } = this.SentenceMaker.Delete(row as unknown as Record<string, unknown>);
        this.ExecuteQuery(query, params);
    }

    public Get(WhereSentence: string = "", params: any[] = [], limit: number = 0) {
        const Sentence: string = this.SentenceMaker.Select(WhereSentence, limit);
        return this.GetAllRecords<UsingToday>(Sentence, params);
    }

    public GetUsersConfirmed(IdGrp: number, Shift: string): { UserNam: string, TlfNam: string }[] {
        const { start, end } = DateUtils.GetTodayRange();
        const query = `
            SELECT u.UserNam, u.TlfNam
            FROM UsingToday ut
            INNER JOIN GrpRel gr ON ut.IdRel = gr.IdRel
            INNER JOIN Usuarios u ON gr.IdUsr = u.IdUsr
            WHERE gr.IdGrp = ? 
            AND ut.Shift = ? 
            AND ut.RegDat >= ? 
            AND ut.RegDat <= ?
            AND ut.IsUsing = 1
        `;
        return this.GetAllRecords<{ UserNam: string, TlfNam: string }>(query, [IdGrp, Shift, start, end]);
    }

    public RegisterUsageIfNotExists(row: UsingToday, start: number, end: number): boolean {
        let inserted = false;
        this.RunTransaction(() => {
            const existing = this.Get("IsUsing = 1 AND IdRel = ? AND Shift = ? AND RegDat >= ? AND RegDat <= ?",
                [row.IdRel, row.Shift, start, end]);

            if (existing.filter(e => e.Shift === row.Shift).length === 0) {
                this.Add(row);
                inserted = true;
            }
        });
        return inserted;
    }

    public UnRegisterUsageIfExists(row: UsingToday, start: number, end: number): boolean {
        let updated = false;
        this.RunTransaction(() => {
            const existing = this.Get("IsUsing = 1 AND IdRel = ? AND Shift = ? AND RegDat >= ? AND RegDat <= ?",
                [row.IdRel, row.Shift, start, end]);

            let searchedResults = existing.filter(e => e.Shift === row.Shift);
            if (searchedResults.length === 1) {
                let asistingRegister = searchedResults[0];
                asistingRegister!.IsUsing = 0;

                this.Update(asistingRegister!);
                updated = true;
            }

            if (searchedResults.length === 0) {
                let asistingRegister = new UsingToday();
                asistingRegister.IdRel = row.IdRel;
                asistingRegister.IsUsing = 0;
                asistingRegister.Shift = row.Shift;

                this.Add(asistingRegister!);
                updated = true;
            }

        });
        return updated;
    }

}

export default UsingTodayService;