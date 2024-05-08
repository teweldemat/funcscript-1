using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace fsstudio.server.fileSystem;

public class FileOperationModel
{
    public string Path { get; set; }=""; // Path relative to root_folder
    public string Name { get; set; }=""; // Name of the new file or folder
}

[Route("api/[controller]")]
[ApiController]
public class FileSystemController : ControllerBase
{
    private readonly string _rootPath;

    public FileSystemController(IConfiguration configuration)
    {
        _rootPath = configuration.GetValue<string>("RootFolder")!;
    }
    
    // GET: api/FileSystem/ListSubFoldersAndFiles
    [HttpGet("ListSubFoldersAndFiles")]
    public IActionResult ListSubFoldersAndFiles([FromQuery] string path)
    {
        string fullPath =Program.GetAbsolutePath(_rootPath, path);
        if (!Directory.Exists(fullPath))
        {
            return NotFound("Directory not found.");
        }

        var directories = Directory.GetDirectories(fullPath).Select(Path.GetFileName).ToArray();
        var files = Directory.GetFiles(fullPath, "*.fsp").Select(n=>
        {
            var f = new System.IO.FileInfo(n);
            return f.Name.Substring(0,f.Name.Length-f.Extension.Length);
        }).ToArray();

        return Ok(new { Directories = directories, Files = files });
    }

    // POST: api/FileSystem/CreateFolder
    [HttpPost("CreateFolder")]
    public IActionResult CreateFolder([FromBody] FileOperationModel model)
    {
        string fullPath = Program.GetAbsolutePath(_rootPath, Path.Combine(model.Path, model.Name));
        if (Directory.Exists(fullPath))
        {
            return Conflict("Folder already exists.");
        }

        Directory.CreateDirectory(fullPath);
        return Created(fullPath, $"Folder '{model.Name}' created successfully.");
    }
    
    // POST: api/FileSystem/CreateFile
    [HttpPost("CreateFile")]
    public IActionResult CreateFile([FromBody] FileOperationModel model)
    {
        string fullPath = Program.GetAbsolutePath(_rootPath, Path.Combine(model.Path, model.Name + ".fsp"));
        if (System.IO.File.Exists(fullPath))
        {
            return Conflict("File already exists.");
        }

        using (var stream = System.IO.File.CreateText(fullPath))
        {
            stream.Write("[]");
        }
        return Created(fullPath, $"File '{model.Name}.fsp' created successfully.");
    }
    // DELETE: api/FileSystem/DeleteFile
    [HttpDelete("DeleteItem")]
    public IActionResult DeleteItem(string path)
    {
        string fullPath = Program.GetAbsolutePath(_rootPath, path);
        if (System.IO.File.Exists(fullPath + ".fsp"))
            System.IO.File.Delete(fullPath + ".fsp");
        else if (System.IO.Directory.Exists(fullPath))
            System.IO.Directory.Delete(fullPath, true); // Added 'true' to recursively delete directories
        else
            return NotFound("Path not found.");

        return Ok($"File '{path}' deleted successfully.");
    }

    
    // PUT: api/FileSystem/RenameItem
    [HttpPut("RenameItem")]
    public IActionResult RenameItem([FromBody] FileOperationModel model)
    {
        string fullPath = Program.GetAbsolutePath(_rootPath, model.Path);
        if (System.IO.Directory.Exists(fullPath))
        {
            string directory = System.IO.Directory.GetParent(fullPath)!.FullName;
            string newPath = Path.Combine(directory, model.Name);
            if (System.IO.Directory.Exists(newPath))
                return Conflict($"Path {newPath} already exists");
            Console.WriteLine($"{fullPath} > {newPath}");
            Directory.Move(fullPath,newPath);
        }
        else
        {
            fullPath += ".fsp";
            if (System.IO.File.Exists(fullPath))
            {
                string directory = new System.IO.FileInfo(fullPath).DirectoryName!;
                string newPath = Path.Combine(directory, model.Name)+".fsp";
                if ( System.IO.File.Exists(newPath))
                    return Conflict($"Path {newPath} already exists");
                Console.WriteLine($"{fullPath} > {newPath}");
                System.IO.File.Move(fullPath,newPath);
            }
            else
                return NotFound($"Path {model.Path} not found");
        }
        return Ok($"File '{model.Name}' renamed successfully.");
    }
}
