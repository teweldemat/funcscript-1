using System.Collections.Concurrent;
using funcscript.funcs.misc;

namespace fsstudio.server.fileSystem.exec
{
    public class SessionManager
    {
        
        class RemoteLoggerForFs(RemoteLogger rl) : Fslogger
        {
            public override void WriteLine(string text)
            {
                rl.WriteLine(text);
            }

            public override void Clear()
            {
                Console.WriteLine("Clearing console");
                rl.Clear();
            }
        }
        private readonly ConcurrentDictionary<Guid, ExecutionSession> _sessions = new();

        private readonly string _rootPath;
        public String RootPath => _rootPath;
        private readonly RemoteLogger remoteLogger;
        public SessionManager(IConfiguration configuration,RemoteLogger remoteLogger)
        {
            this.remoteLogger = remoteLogger;
            _rootPath = configuration.GetValue<string>("RootFolder")!;
            Fslogger.SetDefaultLogger(new RemoteLoggerForFs(remoteLogger));
        }

        public ExecutionSession CreateSession(string fromFile)
        {
            var session = new ExecutionSession(Program.GetAbsolutePath(_rootPath, fromFile + ".fsp"),remoteLogger);
            _sessions.TryAdd(session.SessionId, session);
            return session;
        }
        public bool UnloadSession(Guid sessionId)
        {
            return _sessions.TryRemove(sessionId, out _);
        }

        public ExecutionSession? GetSession(Guid sessionId)
        {
            _sessions.TryGetValue(sessionId, out var session);
            return session;
        }
    }
}