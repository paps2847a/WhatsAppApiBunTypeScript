import ollama from "ollama"
import { file } from "bun";
import Logger from "./Logger";

class SentimentValidator
{
    private static FILE_PROMPT_DIR: string = "./src/Resources/ModelPrompt.txt";
    private static MODEL_NAME: string = "gemma3n:e2b";
    private static MODEL_PROMPT: string = "";
    
    public static async ValidateSentiment(msg: string): Promise<boolean>
    {
        let response = await ollama.generate({
            model: this.MODEL_NAME,
            prompt: msg,
            system: this.MODEL_PROMPT
        });

        let sentiment = response.response.trim().toLowerCase();
        return sentiment === "1" ? true : false;
    }

    public static async LoadPrompt(): Promise<void>
    {
        let checkingFile = file(this.FILE_PROMPT_DIR);
        if(!await checkingFile.exists())
            throw new Error("Prompt file not found");
        
        this.MODEL_PROMPT = await checkingFile.text();
        Logger.Log(`Loaded Model Prompt`);
    }

}

export default SentimentValidator;