namespace funcscript.core
{
    public interface IFsDataProvider        
    {
        object GetData(String name);
        public IFsDataProvider ParentProvider { get; }
        bool IsDefined(string key);
    }
}
