using Accessibility;
using funcscript.model;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace fsstudio
{
    public struct DPoint
    {
        public double X, Y;

        public DPoint(double x, double y)
        {
            X = x;
            Y = y;
        }
    }
    public interface ICTransform
    {
        DPoint FromScreen(Point p);
        Point ToScreen(DPoint dPoint);
    }
    public class DrawableCollection : IDrawable
    {
        double _xmin=0,_xmax=0,_ymin = 0,_ymax = 0;
        IList<IDrawable> _collection;
        public DrawableCollection(IList<IDrawable> collection)
        {
            _collection = collection;
            if (_collection != null)
            {
                var first = true;
                foreach (var item in _collection)
                {
                    if (item != null)
                    {
                        if (first)
                        {
                            _xmin = item.XMin;
                            _xmax = item.XMax;
                            _ymin = item.YMin;
                            _ymax = item.YMax;
                            first = false;
                        }
                        else
                        {
                            if (item.XMin < _xmin)
                                _xmin = item.XMin;
                            if (item.XMax> _xmax)
                                _xmax = item.XMax;
                            if (item.YMin< _ymin)
                                _ymin= item.YMin;
                            if (item.YMax > _ymax)
                                _ymax= item.YMax;
                        }
                    }
                }
            }
        }
        public double XMin => _xmin;

        public double XMax => _xmax;

        public double YMin => _ymin;

        public double YMax => _ymax;

        public void Draw(Graphics g, ICTransform tran)
        {
            if (_collection == null)
                return;
            foreach (var item in _collection)
                if (item != null)
                    item.Draw(g, tran);
        }
    }
    public interface IDrawable
    {
        void Draw(Graphics g,ICTransform tran);
        double XMin { get; }
        double XMax { get; }
        double YMin { get; }
        double YMax { get; }
        public static IDrawable LoadFromCollection(KeyValueCollection data)
        {
            if (data == null)
                return null;
            switch (data.Get("type") as string)
            {
                case "point":
                    return data.ConvertTo<PointDrawable>();
                case "line":
                    return data.ConvertTo<LineDrawable>();
                case "col":
                    var list = data.Get("col") as FsList;
                    var col = new List<IDrawable>();
                    foreach(var item in list.Data)
                    {
                        if(item is KeyValueCollection)
                        {
                            col.Add(LoadFromCollection((KeyValueCollection)item));
                        }
                    }
                    return new DrawableCollection(col);
                default:
                    return null;
            }
        }
    }
    public class PointDrawable:IDrawable
    {
        public double X;
        public double Y;
        public int Argb;
        public int Width;

        public double XMin => X;
        public double XMax => X;
        public double YMin => Y;
        public double YMax => Y;

        public void Draw(Graphics g, ICTransform tran)
        {
            g.FillEllipse(new SolidBrush(Color.FromArgb(Argb)), 
                new Rectangle(tran.ToScreen(new DPoint(X, Y)), new Size(Width, Width)));
        }
    }
    public class LineDrawable : IDrawable
    {
        public double X1, Y1, X2, Y2;
        public int Width;
        public int Argb;
        public double XMin => X1 < X2 ? X1 : X2;
        public double XMax => X1 > X2 ? X1 : X2;
        public double YMin => Y1 < Y2 ? Y1 : Y2;
        public double YMax => Y1 > Y2 ? Y1 : Y2;
        public void Draw(Graphics g, ICTransform tran)
        {
            g.DrawLine(new Pen(Color.FromArgb(Argb),(float)Width), tran.ToScreen(new DPoint(X1, Y1)), tran.ToScreen(new DPoint(X2, Y2)));
        }
    }
    
    internal class FSDraw:Panel,ICTransform
    {
        IDrawable _drawable;
        bool _validData;
        double _xmin, _xmax, _ymin, _ymax;
        protected override void OnPaintBackground(PaintEventArgs e)
        {
            _validData = false;
        }
        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.Clear(Color.Black);
            if(_drawable!=null)
            {
                _drawable.Draw(e.Graphics,this);
            }
        }
        public void SetDrawablesAndFit(IDrawable drawable)
        {
            _drawable = drawable;
            _validData = false;
            if(_drawable!=null)
            {
                _validData = (_drawable.XMax - _drawable.XMin) < 0.01 &&
                    (_drawable.YMax - _drawable.YMin) < 0.01;
                if (_validData)
                {
                    _xmin = _drawable.XMin;
                    _xmax = _drawable.XMax;
                    _ymin = _drawable.YMin;
                    _ymax = _drawable.YMax;
                }
            }
            this.Invalidate();
        }

        
        public DPoint FromScreen(Point p)
        {
            throw new NotImplementedException();
        }

        public Point ToScreen(DPoint dPoint)
        {
            return new Point((int)((dPoint.X - _xmin) / (_xmax - _xmin)),
                    this.Height- (int)((_ymax - dPoint.Y) / (_ymax - _ymin))
                );
        }
    }
}
