using funcscript.core;

namespace funcscript.block
{
    public class ReferenceBlock : ExpressionBlock
    {
        string _name, _nameLower;
        private bool _fromParent;
        public string Name
        {
            get
            {
                return _name;
            }
            set
            {
                if (value == null)
                {
                    _name = _nameLower = null;
                }
                else
                {
                    _name = value;
                    _nameLower = _name.ToLower();
                }
            }
        }
        public ReferenceBlock(string name)
        {
            Name = name;
            _fromParent = false;
        }
        public ReferenceBlock(string name, string nameLower)
        {
            Name = name;
            _nameLower = nameLower;
            _fromParent = false;
        }
        public ReferenceBlock(string name, string nameLower,bool fromParent)
        {
            Name = name;
            _nameLower = nameLower;
            _fromParent =fromParent;
        }
        public override (object,CodeLocation) Evaluate(IFsDataProvider provider,List<Action> connectionActions)
        {
            if (_fromParent)
                return (provider.ParentProvider?.GetData(_nameLower),this.CodeLocation);
            return (provider.GetData(_nameLower), this.CodeLocation);
        }

        public override IList<ExpressionBlock> GetChilds()
        {
            return new ExpressionBlock[0];
        }
        public override string ToString()
        {
            return Name;
        }

        public override string AsExpString(IFsDataProvider provider)
        {
            return Name;
        }

    }

}
