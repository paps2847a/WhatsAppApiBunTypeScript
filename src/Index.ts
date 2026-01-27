import client from "./Client";
import DbCreator from "./Db/DbCreator";
import type IBackGroundInterface from "./Utils/IBackGroundInterface";
import TravelInitWorker from "./BackgroundWorkers/TravelInitWorker";
import GruposService from "./Services/GruposService";
import SentimentValidator from "./Utils/SentimentValidator";

const creator = new DbCreator();
//OJO CON ESTO
await creator.CreateDb();

//Prueba menor de worker
//Idea: Crear un worker que se encargue de enviar mensajes en segundo plano a los grupos para organizar viajes
let job: IBackGroundInterface = new TravelInitWorker(client, {
    allowedHours: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    checkIntervalMs: 5 * 60 * 1000 // cada 5 minutos
});
job.DefineAndRegister();

await SentimentValidator.LoadPrompt();

client.initialize();