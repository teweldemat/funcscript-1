using System.Text;
using funcscript.core;
using funcscript.model;

namespace funcscript.nodes;

public class HttpClientNode:ObjectKvc
{
    private object _url = null;
    private object _inData = null;
    private object _headers = null;

    private readonly HttpClient _httpClient = new HttpClient();
    private VariableValue _outData = new VariableValue();
    private VariableValue _errorData = new VariableValue();

    private SignalSinkInfo _doneSink = new SignalSinkInfo();
    private SignalSinkInfo _errorSink = new SignalSinkInfo();
    private ValDel _headerSource;
    private ValDel _urlSource;
    private ValDel _inDataSource;

    public HttpClientNode()
    {
        base.SetVal(this);   
        _headerSource=new ValDel(val => { _headers = val; });
        _urlSource=new ValDel( val => { _url = val; });
        _inDataSource=new ValDel( val => { _inData = val; });
    }
    public ValueSinkDelegate Headers => _headerSource;
    public ValueSinkDelegate Url => _urlSource;
    public ValueSinkDelegate InData => _inDataSource;
    public ValueReferenceDelegate OutData => _outData;
    public ValueReferenceDelegate ErrorData => _errorData;
    public SignalSourceDelegate Success =>new SigSource( (n, e) => _doneSink.SetSink(n, e));
    public SignalSourceDelegate Fail =>new SigSource( (n, e) => _errorSink.SetSink(n, e));

    async Task<(HttpRequestMessage, HttpResponseMessage)> SendGetRequest(string url)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        AddHeadersToRequest(request);
        HttpResponseMessage response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return (request, response);
    }

    async Task<HttpResponseMessage> SendPostRequest(string url, HttpContent content)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = content
        };
        AddHeadersToRequest(request);
        HttpResponseMessage response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return response;
    }

    void AddHeadersToRequest(HttpRequestMessage request)
    {
        if (FuncScript.Dref(_headers) is KeyValueCollection h)
        {
            IList<KeyValuePair<string, object>> headers = h.GetAll();
            foreach (var header in headers)
            {
                request.Headers.TryAddWithoutValidation(header.Key, FuncScript.Dref(header.Value).ToString());
            }
        }
    }

    public SignalListenerDelegate GetJson =>new SigSink( async () =>
    {
        try
        {
            _errorData.Val = null;
            _outData.Val = null;
            string url = FuncScript.Dref(_url).ToString();

            (var request, var response) = await SendGetRequest(url);
            string responseBody = await response.Content.ReadAsStringAsync();
            
            _outData.Val = FuncScript.Evaluate(null, responseBody);
            
            response.Dispose();
            request.Dispose();
            _doneSink.Signal();
        }
        catch (HttpRequestException e)
        {
            _errorData.Val = $"Error: {e.Message}";
            _errorSink.Signal();
        }
    });

    public SignalListenerDelegate GetText => new SigSink(async () =>
    {
        try
        {
            _errorData.Val = null;
            _outData.Val = null;
            string url = FuncScript.Dref(_url).ToString();

            (var request, var response) = await SendGetRequest(url);
            string responseBody = await response.Content.ReadAsStringAsync();
            string contentType = response.Content.Headers.ContentType?.MediaType; // Safely get the Content-Type

            _outData.Val = new
            {
                ContentType = contentType,
                Content = responseBody
            };
            response.Dispose();
            request.Dispose();
            _doneSink.Signal();
        }
        catch (HttpRequestException e)
        {
            _errorData.Val = $"Error: {e.Message}";
            _errorSink.Signal();
        }
    });

    public SignalListenerDelegate PostJson => new SigSink(async () =>
    {
        try
        {
            _errorData.Val = null;
            _outData.Val = null;
            string url = FuncScript.Dref(_url).ToString();
            object data = FuncScript.Dref(_inData);
            var jsonData = FuncScript.FormatToJson(data);
            var content = new StringContent(jsonData, Encoding.UTF8, "application/json");

            HttpResponseMessage response = await SendPostRequest(url, content);
            string responseBody = await response.Content.ReadAsStringAsync();
            Console.WriteLine("Json\n" + jsonData);
            if(response.Content.Headers.ContentType?.MediaType=="application/json")
                _outData.Val = FuncScript.Evaluate(null, responseBody);
            else
            {
                _outData.Val = responseBody;
            }
            response.Dispose();
            _doneSink.Signal();
        }
        catch (Exception e)
        {
            _errorData.Val = $"Error: {e.Message}";
            _errorSink.Signal();
        }
    });
}

public class CreateHttpClientNodeFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        return new HttpClientNode();
    }

    public string ParName(int index)
    {
        return null;
    }

    public int MaxParsCount => 0;
    public CallType CallType => CallType.Prefix;
    public string Symbol => "HttpClient";
    public int Precidence => 0;
}