export default class UsingToday{
    public IdUsing: number = 0;
    public IdRel: number = 0;
    public IsUsing: number = 1;
    public IsAct: number = 1;
    public RegDat: string = new Date().toJSON();
    public Shift: string = "";
}