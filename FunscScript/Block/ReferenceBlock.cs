using FunscScript.Core;

namespace FunscScript.Block
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
        public override object Evaluate(IFsDataProvider provider)
        {
            if (_fromParent)
                return provider.ParentProvider?.Get(_nameLower);
            return provider.Get(_nameLower);
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
