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

    public InsertInto(Row: Object): string {
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
                Query.Append(` ${DataFromObject[item]} `);
            else
                Query.Append(` ${DataFromObject[item]}, `);
        }

        Query.Append(") ");

        return Query.ToString();
    }

    public Update(Row: Object): string {
        let DataFromObject = Object.values(Row);
        let Pk = DataFromObject[0];

        DataFromObject = DataFromObject.slice(1, DataFromObject.length);

        let Query = new StringBuilder(`update ${this.Tablename} SET `);

        for (let item = 0; item < this.TableColumns.length; item++) {
            if (this.LastOne(item, this.TableColumns.length))
                Query.Append(` ${this.TableColumns[item]} = '${DataFromObject[item]}' `);
            else
                Query.Append(` ${this.TableColumns[item]} = '${DataFromObject[item]}', `);
        }

        Query.Append(`WHERE ${this.PkColumnsName} = ${Pk}`);

        return Query.ToString();
    }

    public Delete(Row: Object): string {
        let DataFromObject = Object.values(Row);
        let Pk = DataFromObject[0];

        let Query = new StringBuilder(`delete from ${this.Tablename} WHERE ${this.PkColumnsName} = ${Pk}`);
        return Query.ToString();
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