export default class StringBuilder
{
    private StringOnConstruct: string[] = [];

    constructor(StrInit: string)
    {
        this.StringOnConstruct.push(StrInit);
    }

    public Append(StrData: string)
    {
        this.StringOnConstruct.push(StrData);
    }

    public ToString(): string
    {
        return this.StringOnConstruct.join("");
    }

}