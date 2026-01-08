import DataHandler from "../Db/DataHandler.ts";
import Drivers from "../Models/Drivers.ts";

class DriversService extends DataHandler
{
    private TableName: string = Drivers.name;

    public async Add(row: Drivers)
    {
        Drivers.toString();
        let query = this.Db.query(`insert into ${this.TableName} ("UserNam","TlfNam") values ("${row.DesDrive}", "r${row.TlfNam}")`);
    }


}