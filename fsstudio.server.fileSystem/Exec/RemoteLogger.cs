using System.Net.WebSockets;
using System.Text;

namespace fsstudio.server.fileSystem.exec;
public class WebSocketMiddleware
{
    private readonly RequestDelegate _next;
    private RemoteLogger _logger;

    public WebSocketMiddleware(RequestDelegate next, RemoteLogger logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.WebSockets.IsWebSocketRequest)
        {
            WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync();
            await _logger.AddClient(webSocket);
        }
        else
        {
            await _next(context);
        }
    }
}
public class RemoteLogger
{
    private List<WebSocket> _clients = new List<WebSocket>();

    public async Task AddClient(WebSocket client)
    {
        _clients.Add(client);
        await ListenToDisconnect(client);
    }

    private async Task ListenToDisconnect(WebSocket client)
    {
        var buffer = new byte[1024 * 4];
        while (client.State == WebSocketState.Open)
        {
            await client.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
        }
        _clients.Remove(client);
    }

    public async Task SendMessage(string cmd, string? data)
    {
        foreach (var client in _clients.ToList())
        {
            if (client.State == WebSocketState.Open)
            {
                var msg = Encoding.UTF8.GetBytes(System.Text.Json.JsonSerializer.Serialize(new {cmd,data}));
                await client.SendAsync(new ArraySegment<byte>(msg), WebSocketMessageType.Text, true, CancellationToken.None);
            }
            else
            {
                _clients.Remove(client);
            }
        }
    }
    public async void WriteLine(string message)
    {
        await SendMessage("log",message);
    }

    public async void Clear()
    {
        await SendMessage("clear",null);
    }
}