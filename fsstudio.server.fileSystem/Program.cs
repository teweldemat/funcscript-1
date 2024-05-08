using System.Diagnostics;
using System.Runtime.InteropServices;
using fsstudio.server.fileSystem.exec;


namespace fsstudio.server.fileSystem;
internal class Program
{
    private static void Main(string[] args)
    {
        var options = new WebApplicationOptions
        {
            Args = args,
            WebRootPath = "wwwroot", 
            ApplicationName = "FsStudio",
        };

        var builder = WebApplication.CreateBuilder(options);
        //var builder = WebApplication.CreateBuilder(args);
        var env = builder.Environment;
        //builder.WebHost.UseWebRoot("wwwroot");
        if (env.IsDevelopment())
        {
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
        }

        builder.Services.AddControllers().AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        });
        builder.Services.AddSingleton<RemoteLogger>();
        builder.Services.AddSingleton<SessionManager>();
        var app = builder.Build();
        if (env.IsDevelopment())
        {
            app.UseCors("AllowSpecificOrigin");
        }
        app.MapControllers();
        
        app.UseWebSockets();
        app.UseMiddleware<WebSocketMiddleware>();
        
        var defaultFileOptions = new DefaultFilesOptions();
        defaultFileOptions.DefaultFileNames.Clear(); 
        defaultFileOptions.DefaultFileNames.Add("index.html"); 
        app.UseDefaultFiles(defaultFileOptions);
        app.UseStaticFiles(); 
        
        if (env.IsEnvironment("Desktop"))
        {
            // Launch the browser after the server starts
            app.Lifetime.ApplicationStarted.Register(() =>
            {
                try
                {
                    string url = "http://localhost:5091"; // Ensure this is the correct URL
                    if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                    {
                        Process.Start(new ProcessStartInfo("cmd", $"/c start {url}") { CreateNoWindow = true });
                    }
                    else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                    {
                        Process.Start("xdg-open", url);
                    }
                    else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
                    {
                        Process.Start("open", url);
                    }
                }
                catch (Exception ex)
                {
                    // Log the exception if needed
                    Console.WriteLine($"Failed to launch browser: {ex.Message}");
                }
            });
        }

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