namespace fsstudio.server.fileSystem;

public class ErrorData
{
    public class ErrorItem(Exception ex)
    {
        public string Type { get; set; } = ex.GetType().ToString();
        public string Message { get; set; } = ex.Message;
        public string? StackTrace { get; set; } = ex.StackTrace;
    }
    public IList<ErrorItem> Errors { get; set; }

    public ErrorData(Exception ex)
    {
        var errors = new List<ErrorItem>();
        var cur = ex;
        while (cur!=null)
        {
            errors.Add(new ErrorItem(cur));
            cur = cur.InnerException;
        }

        this.Errors = errors;
    }
}