namespace funcscript.core
{
    public interface IFsDataProvider        
    {
        object Get(String name);
        public IFsDataProvider ParentProvider { get; }
        bool IsDefined(string key);
    }
}
