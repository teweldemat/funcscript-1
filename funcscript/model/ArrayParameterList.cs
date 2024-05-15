using funcscript.core;

namespace funcscript.model;

public class ArrayParameterList : IParameterList
{
    private readonly object[] parameters;

    public ArrayParameterList(object[] parameters)
    {
        this.parameters = parameters ?? throw new ArgumentNullException(nameof(parameters));
    }

    public override int Count { get; }

    public override (object,CodeLocation) GetParameterWithLocation(IFsDataProvider provider, int index)
    {
        // Check for out-of-bounds to prevent runtime exceptions.
        if (index < 0 || index >= this.parameters.Length)
        {
            throw new IndexOutOfRangeException("Parameter index is out of range.");
        }

        // Return the parameter from the internal array.
        return (this.parameters[index],null);
    }
}