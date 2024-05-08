using System.Text;
using funcscript.core;
using funcscript.model;

namespace funcscript.nodes;

public class HttpClientNode
{
    private object _url = null;
    private object _inData = null;
    private object _headers = null;

    private readonly HttpClient _httpClient = new HttpClient();
    private object _outData;
    private string _errorData;

    private SignalSinkInfo _doneSink = new SignalSinkInfo();
    private SignalSinkInfo _errorSink = new SignalSinkInfo();

    public ValueSinkDelegate Headers => val => { _headers = val; };
    public ValueSinkDelegate Url => val => { _url = val; };
    public ValueSinkDelegate InData => val => { _inData = val; };
    public ValueReferenceDelegate OutData => () => _outData;
    public ValueReferenceDelegate ErrorData => () => _errorData;
    public SignalSourceDelegate Success => (n, e) => _doneSink.SetSink(n, e);
    public SignalSourceDelegate Fail => (n, e) => _errorSink.SetSink(n, e);

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

    public SignalListenerDelegate GetJson => async () =>
    {
        try
        {
            _errorData = null;
            _outData = null;
            string url = FuncScript.Dref(_url).ToString();

            (var request, var response) = await SendGetRequest(url);
            string responseBody = await response.Content.ReadAsStringAsync();
            _outData = FuncScript.Evaluate(null, responseBody);
            response.Dispose();
            request.Dispose();
            _doneSink.Signal();
        }
        catch (HttpRequestException e)
        {
            _errorData = $"Error: {e.Message}";
            _errorSink.Signal();
        }
    };

    public SignalListenerDelegate GetText => async () =>
    {
        try
        {
            _errorData = null;
            _outData = null;
            string url = FuncScript.Dref(_url).ToString();

            (var request, var response) = await SendGetRequest(url);
            string responseBody = await response.Content.ReadAsStringAsync();
            string contentType = response.Content.Headers.ContentType?.MediaType; // Safely get the Content-Type

            _outData = new
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
            _errorData = $"Error: {e.Message}";
            _errorSink.Signal();
        }
    };

    public SignalListenerDelegate PostJson => async () =>
    {
        try
        {
            _errorData = null;
            _outData = null;
            string url = FuncScript.Dref(_url).ToString();
            string jsonData = FuncScript.Dref(_inData)?.ToString() ?? "{}";
            var content = new StringContent(jsonData, Encoding.UTF8, "application/json");

            HttpResponseMessage response = await SendPostRequest(url, content);
            string responseBody = await response.Content.ReadAsStringAsync();
            Console.WriteLine("Json\n"+jsonData);
            _outData = FuncScript.Evaluate(null, responseBody);
            response.Dispose();
            _doneSink.Signal();
        }
        catch (Exception e)
        {
            _errorData = $"Error: {e.Message}";
            _errorSink.Signal();
        }
    };
}

public class CreateHttpClientNodeFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        return new ObjectKvc(new HttpClientNode());
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