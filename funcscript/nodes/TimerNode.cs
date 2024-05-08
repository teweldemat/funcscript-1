using funcscript.core;
using funcscript.model;

namespace funcscript.nodes;

class TimerNode
{
    private Timer _timer;
    private int _interval;
    private bool _repeating;
    private SignalSinkInfo _sinks = new SignalSinkInfo();
    public TimerNode(int interval, bool repeating = false)
    {
        _interval = interval;
        _repeating = repeating;

    }

    public SignalSourceDelegate Tick => _sinks.SetSink;
    // Signal to start the timer
    public SignalListenerDelegate Start => () => 
    {
        _timer?.Dispose(); // Dispose previous timer if any
        var ts = new TimeSpan(0, 0, 0, 0, _interval);
        _timer = new Timer(state => _sinks.Signal(), null,ts,  _repeating ? ts: Timeout.InfiniteTimeSpan);
    };

    // Signal to stop the timer
    public SignalListenerDelegate Stop => () =>
    {
        _timer?.Dispose();
        _timer = null;
    };

}

public class CreateTimerFunction : IFsFunction
{
    public object Evaluate(IFsDataProvider parent, IParameterList pars)
    {
        if (pars.Count < 1 || !(pars.GetParameter(parent,0) is int interval))
            throw new error.TypeMismatchError("Timer requires at least one parameter: interval as TimeSpan.");

        bool repeating = false;
        if (pars.Count > 1 && pars.GetParameter(parent,1) is bool repeat)
            repeating = repeat;

        return new ObjectKvc(new TimerNode(interval, repeating));
    }

    public string ParName(int index)
    {
        switch (index)
        {
            case 0: return "interval";
            case 1: return "repeating";
            default: return null;
        }
    }

    public int MaxParsCount => 2;
    public CallType CallType => CallType.Prefix;
    public string Symbol => "Timer";
    public int Precidence => 0;
}