using System.Diagnostics;
using System.Net.WebSockets;
using fsstudio.server.fileSystem.exec;


namespace fsstudio.server.fileSystem;
internal class Program
{
    private static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        builder.WebHost.UseWebRoot("wwwroot"); // Adjust the path as necessary
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowSpecificOrigin",
                builder =>
                {
                    builder.WithOrigins("http://localhost:3000") 
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
        });

        builder.Services.AddControllers().AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        });
        builder.Services.AddSingleton<RemoteLogger>();
        builder.Services.AddSingleton<SessionManager>();
        var app = builder.Build();

        app.UseCors("AllowSpecificOrigin");
        app.MapControllers();
        
        app.UseWebSockets();
        app.UseMiddleware<WebSocketMiddleware>();
        
        var defaultFileOptions = new DefaultFilesOptions();
        defaultFileOptions.DefaultFileNames.Clear(); 
        defaultFileOptions.DefaultFileNames.Add("index.html"); 
        app.UseDefaultFiles(defaultFileOptions);
        app.UseStaticFiles(); 
        
        app.Run();
    }
    
    public static String GetAbsolutePath(string rootPath, string relativePath)
    {
        if (relativePath.StartsWith("/"))
            return GetAbsolutePath(rootPath, relativePath.Substring(1));
        if(relativePath.EndsWith("/"))
            return GetAbsolutePath(rootPath, relativePath.Substring(0,relativePath.Length-1));
        return Path.Combine(rootPath, relativePath);
    }
}