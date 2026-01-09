import DataHandler from "../Db/DataHandler.ts";
import Drivers from "../Models/Drivers.ts";
import StringBuilder from "../Utils/StringBuilder.ts";

class DriversService extends DataHandler {
    private TableName: string = Drivers.name;
    private PropNames: string[] = Object.getOwnPropertyNames(new Drivers());

    public async Add(row: Drivers) {
        
        let query = this.Db.query(`insert into ${this.TableName} ("UserNam","TlfNam") 
                                   values ("${row.DesDrive}", "r${row.TlfNam}")`);

    }

    public async Update(row: Drivers) {
        let SqlQuery: StringBuilder = new StringBuilder(`update ${this.TableName}`);
        SqlQuery.Append(`( `);

        for(let item in this.PropNames)
        {
            if(!item.includes("Id"))
                SqlQuery.Append(`'${item}'`);
        }

        SqlQuery.Append(` )`);

        let query = this.Db.query(`update ${this.TableName} ("UserNam","TlfNam") 
                                   values ("${row.DesDrive}", "r${row.TlfNam}")`);

    }


}   