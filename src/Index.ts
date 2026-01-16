import client from "./Client";
import DbCreator from "./Db/DbCreator";

new DbCreator().CreateDb();
client.initialize();