import StringBuilder from "./StringBuilder";

export default class SqlTableQueryMaker {
    private Tablename: string;
    private TableColumns: string[];
    private PkColumnsName: string | undefined;

    constructor(TableStr: string, TablePropsNames: string[]) {
        this.Tablename = TableStr;
        this.PkColumnsName = TablePropsNames[0];
        this.TableColumns = TablePropsNames.slice(1, TablePropsNames.length);
    }

    private LastOne(a: number, b: number): boolean {
        return (b - a) == 1 ? true : false;
    }

    private formatValue(value: unknown): string {
        if (value === null || value === undefined) return "NULL";
        if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
        return `${value}`;
    }

    public InsertInto(Row: Record<string, unknown>): { query: string, params: unknown[] } {
        let Query = new StringBuilder(`insert into ${this.Tablename} (`);

        for (let item = 0; item < this.TableColumns.length; item++) {
            if (this.LastOne(item, this.TableColumns.length))
                Query.Append(` ${this.TableColumns[item]} `);
            else
                Query.Append(` ${this.TableColumns[item]}, `);
        }

        Query.Append(") ");
        Query.Append(" values (");

        let DataFromObject = Object.values(Row);
        DataFromObject = DataFromObject.slice(1, DataFromObject.length);

        for (let item = 0; item < DataFromObject.length; item++) {
            if (this.LastOne(item, DataFromObject.length))
                Query.Append(` ? `);
            else
                Query.Append(` ?, `);
        }

        Query.Append(") ");
        Query.Append(` RETURNING last_insert_rowid()`);

        return { query: Query.ToString(), params: DataFromObject };
    }

    public Update(Row: Record<string, unknown>): { query: string, params: unknown[] } {
        let DataFromObject = Object.values(Row);
        const Pk = DataFromObject[0];

        DataFromObject = DataFromObject.slice(1, DataFromObject.length);

        let Query = new StringBuilder(`update ${this.Tablename} SET `);

        for (let item = 0; item < this.TableColumns.length; item++) {
            if (this.LastOne(item, this.TableColumns.length))
                Query.Append(` ${this.TableColumns[item]} = ? `);
            else
                Query.Append(` ${this.TableColumns[item]} = ?, `);
        }

        Query.Append(`WHERE ${this.PkColumnsName} = ?`);

        return { query: Query.ToString(), params: [...DataFromObject, Pk] };
    }

    public Delete(Row: Record<string, unknown>): { query: string, params: unknown[] } {
        const dataFromObject = Object.values(Row);
        const Pk = dataFromObject[0];

        const Query = new StringBuilder(`delete from ${this.Tablename} WHERE ${this.PkColumnsName} = ?`);
        return { query: Query.ToString(), params: [Pk] };
    }

    public Select(WhereSentence: string = "", limit: number = 0): string {
        let Query = new StringBuilder(`select * from ${this.Tablename}`);

        if(WhereSentence != "")
            Query.Append(` WHERE ${WhereSentence}`);

        if(limit != 0)
            Query.Append(` limit ${limit} `);

        return Query.ToString();
    }
}