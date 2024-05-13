using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Concurrent;
using System.Text;
using fsstudio.server.fileSystem;
using fsstudio.server.fileSystem.exec;
using funcscript;
using Microsoft.Net.Http.Headers; // Ensure namespace includes ExecutionSession and related classes

namespace fsstudio.server.fileSystem.Controllers
{
    [ApiController]
    [Route("api/sessions")]
    public class SessionsController(SessionManager sessionManager) : ControllerBase
    {
        private readonly ConcurrentDictionary<Guid, object> _sessionLocks = new();

        private object GetSessionLock(Guid sessionId)
        {
            return _sessionLocks.GetOrAdd(sessionId, _ => new object());
        }

        public class CreateSessionRequest
        {
            public string FromFile { get; set; }
        }

        [HttpPost("create")]
        public IActionResult CreateSession([FromBody] CreateSessionRequest request
        )
        {
            try
            {
                var session = sessionManager.CreateSession(request.FromFile);
                Console.WriteLine($"Session created {session.SessionId}");
                return Ok(new { SessionId = session.SessionId });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("unload")]
        public IActionResult UnloadSession(Guid sessionId)
        {
            if (sessionManager.UnloadSession(sessionId))
                return Ok();
            else
                return NotFound($"Session with ID {sessionId} not found.");
        }

        [HttpGet("{sessionId}")]
        public IActionResult GetSession(Guid sessionId)
        {
            var session = sessionManager.GetSession(sessionId);
            if (session == null)
                return NotFound($"Session with ID {sessionId} not found.");
            return Ok(session);
        }

        public class ClassCreateNodePars
        {
            public string? ParentNodePath { get; set; }
            public string Name { get; set; }
            public string Expression { get; set; }
            public ExpressionType ExpressionType { get; set; }
        }

        [HttpPost("{sessionId}/node")]
        public IActionResult CreateNode(Guid sessionId, [FromBody] ClassCreateNodePars pars)
        {
            lock (GetSessionLock(sessionId))
            {
                var session = sessionManager.GetSession(sessionId);
                if (session == null)
                    return NotFound($"Session with ID {sessionId} not found.");

                try
                {
                    session.CreateNode(pars.ParentNodePath, pars.Name, pars.Expression, pars.ExpressionType);
                    return Ok();
                }
                catch (Exception ex)
                {
                    return BadRequest(ex.Message);
                }
            }
        }

        [HttpGet("{sessionId}/node")]
        public IActionResult GetNode(Guid sessionId, string nodePath)
        {
            lock (GetSessionLock(sessionId))
            {
                var session = sessionManager.GetSession(sessionId);
                if (session == null)
                    return NotFound($"Session with ID {sessionId} not found.");

                try
                {
                    var ret = session.GetExpression(nodePath);
                    Console.WriteLine("Get expression:" + ret?.Expression);
                    return Ok(ret);
                }
                catch (Exception ex)
                {
                    return BadRequest(ex.Message);
                }
            }
        }

        [HttpDelete("{sessionId}/node")]
        public IActionResult RemoveNode(Guid sessionId, string nodePath)
        {
            lock (GetSessionLock(sessionId))
            {
                var session = sessionManager.GetSession(sessionId);
                if (session == null)
                    return NotFound($"Session with ID {sessionId} not found.");

                try
                {
                    session.RemoveNode(nodePath);
                    return Ok();
                }
                catch (Exception ex)
                {
                    return BadRequest(ex.Message);
                }
            }
        }

        public class RenameNodeRequest
        {
            public string NodePath { get; set; }
            public string NewName { get; set; }
        }

        [HttpPost("{sessionId}/node/rename")]
        public IActionResult RenameNode(Guid sessionId, [FromBody] RenameNodeRequest model)
        {
            lock (GetSessionLock(sessionId))
            {
                var session = sessionManager.GetSession(sessionId);
                if (session == null)
                    return NotFound($"Session with ID {sessionId} not found.");

                try
                {
                    session.RenameNode(model.NodePath, model.NewName);
                    return Ok();
                }
                catch (Exception ex)
                {
                    return BadRequest(ex.Message);
                }
            }
        }

        [HttpPost("{sessionId}/node/expressionType")]
        public IActionResult ChangeExpressionType(Guid sessionId, string nodePath, ExpressionType expressionType)
        {
            lock (GetSessionLock(sessionId))
            {
                var session = sessionManager.GetSession(sessionId);
                if (session == null)
                    return NotFound($"Session with ID {sessionId} not found.");

                try
                {
                    session.ChangeExpressionType(nodePath, expressionType);
                    return Ok();
                }
                catch (Exception ex)
                {
                    return BadRequest(ex.Message);
                }
            }
        }

        public class UpdateExpressionModel
        {
            public string Expression { get; set; }
        }

        [HttpPost("{sessionId}/node/expression/{nodePath}")]
        public IActionResult UpdateExpression(Guid sessionId, string nodePath, [FromBody] UpdateExpressionModel model)
        {
            lock (GetSessionLock(sessionId))
            {
                var session = sessionManager.GetSession(sessionId);
                if (session == null)
                    return NotFound($"Session with ID {sessionId} not found.");

                try
                {
                    session.UpdateExpression(nodePath, model.Expression);
                    return Ok();
                }
                catch (Exception ex)
                {
                    return BadRequest(ex.Message);
                }
            }
        }

        [HttpGet("{sessionId}/node/children")]
        public IActionResult GetChildNodeList(Guid sessionId, string? nodePath)
        {
            lock (GetSessionLock(sessionId))
            {
                var session = sessionManager.GetSession(sessionId);
                if (session == null)
                    return NotFound($"Session with ID {sessionId} not found.");

                try
                {
                    var children = session.GetChildNodeList(nodePath);
                    return Ok(children);
                }
                catch (Exception ex)
                {
                    return BadRequest(ex.Message);
                }
            }
        }

        [HttpGet("{sessionId}/node/value/")]
        public async Task<IActionResult> GetValue(Guid sessionId, string nodePath)
        {
            ExecutionSession? session;
            lock (GetSessionLock(sessionId))
            {
                session = sessionManager.GetSession(sessionId);
                if (session == null)
                    return NotFound($"Session with ID {sessionId} not found.");
            }

            try
            {
                var val = await session.RunNode(nodePath);

                if (val is string str)
                {
                    return Content(str, MediaTypeHeaderValue.Parse("text/plain"));
                }

                var sb = new StringBuilder();
                FuncScript.Format(sb, val, asJsonLiteral: true);
                var json = sb.ToString();
                return Content(json, MediaTypeHeaderValue.Parse("text/plain"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ErrorData(ex));
            }
        }
    }
}