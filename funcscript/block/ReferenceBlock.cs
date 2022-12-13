using funcscript.core;

namespace funcscript.block
{
    public class ReferenceBlock : ExpressionBlock
    {
        string _name, _nameLower;
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
        }
        public ReferenceBlock(string name, string nameLower)
        {
            Name = name;
            _nameLower = nameLower;
        }
        public override object Evaluate(IFsDataProvider provider)
        {
            return provider.GetData(_nameLower);
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
