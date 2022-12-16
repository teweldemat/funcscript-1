using Accessibility;
using funcscript;
using funcscript.core;
using funcscript.error;
using funcscript.model;
using Microsoft.VisualBasic.FileIO;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Wpf;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Intrinsics.X86;
using System.Text;
using System.Windows.Forms;
using System.Xml.Linq;
using static System.ComponentModel.Design.ObjectSelectorEditor;
using static System.Net.Mime.MediaTypeNames;
using static System.Windows.Forms.AxHost;

namespace fsstudio
{
    public partial class MainWindow : Form, IFsDataProvider
    {
        [System.Runtime.InteropServices.DllImport("user32.dll")]
        private extern static IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wp, IntPtr lp);
        public class WorkState
        {
            public String OpenFile = null;
            public Point WindowLocation = new Point(-1, -1);
            public Size WindowSize = new Size(-1, -1);
            public int SplitMainPosition = -1;
            public int SplitRightPosition = -1;
            public int SplitTextPosition = -1;
            public List<Tuple<String, String>> Users = new List<Tuple<string, string>>();
        }

        const string DATA_FOLDER = "data";
        const string STATE_FILE = "state.json";
        const string FILES_FOLDER = "files";
        private const string CODE_FONT_NAME = "Courier New";
        private const float CODE_FONT_SIZE = 12.0f;
        private const int EXP_NODE_PREVIEW = 25;
        String fileName = null;
        ExpressionSystem exp;
        VariableItem selected = null;
        Dictionary<String, int> expIndex = new Dictionary<string, int>();
        DefaultFsDataProvider globalProvider = new DefaultFsDataProvider(
            ((KeyValueCollection)FuncScript.NormalizeDataType(new { pi = Math.PI })).GetAll()
            );
        public MainWindow()
        {
            InitializeComponent();
            textExpression.Font = new Font(CODE_FONT_NAME, CODE_FONT_SIZE);
            textExpression.TextChanged += TextExpression_TextChanged;
            textExpression.SelectionChanged += TextExpression_SelectionChanged;
            textExpression.KeyDown += TextExpression_KeyDown;
            listFiles.ItemSelectionChanged += ListFiles_ItemSelectionChanged;
            LoadSavedState();

        }

        private void TextExpression_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyValue == (int)Keys.Tab)
            {
                if (textExpression.SelectionLength > 2)
                {
                    e.SuppressKeyPress = true;
                    var text = textExpression.Text;
                    var ss = textExpression.SelectionStart;
                    var start = text.LastIndexOf("\n", ss);
                    if (start == -1)
                        start = 0;

                    var slen = textExpression.SelectionLength + textExpression.SelectionStart - start;
                    var selection = text.Substring(start, slen);

                    if (selection.EndsWith("\n"))
                    {
                        selection.Substring(0, selection.Length - 1);
                        textExpression.SelectionLength -= 1;
                    }
                    textExpression.SelectedText = selection.Replace("\n", "\n\t");

                }
            }
        }
        private void ListFiles_ItemSelectionChanged(object sender, ListViewItemSelectionChangedEventArgs e)
        {
            var hasSelection = listFiles.SelectedItems.Count > 0;
            buttonDeleteFile.Enabled = hasSelection;
            if (!hasSelection)
                return;
            SaveCurrent();
            loadFile((string)listFiles.SelectedItems[0].Tag);
        }

        void SelectMain()
        {
            selected = null;
            textName.Enabled = false;
            textExpression.Text = exp.MainExpression;
        }

        void SelectItem(VariableItem item)
        {
            selected = item;
            textName.Enabled = true;
            textName.Text = item.Name;
            textExpression.Text = item.Expression;
        }
        void LoadToForm()
        {
            listVariables.Items.Clear();
            textExpression.Text = exp.MainExpression;
            {
                var li = new ListViewItem("Main Expression");
                li.Tag = null;
                listVariables.Items.Add(li);
            }
            foreach (var e in exp.SupportExpressions)
            {
                var li = new ListViewItem(e.Name);
                li.Tag = e;
                listVariables.Items.Add(li);
            }
        }

        protected override void OnClosing(CancelEventArgs e)
        {
            SaveCurrent();
            var state = new WorkState {
                OpenFile = fileName,
                WindowSize = this.ClientSize,
                SplitMainPosition = this.splitMain.SplitterDistance,
                SplitTextPosition = this.splitText.SplitterDistance,
                SplitRightPosition = this.splitRight.SplitterDistance,
                WindowLocation = this.Location
            };

            System.IO.File.WriteAllText($"{DATA_FOLDER}\\{STATE_FILE}", Newtonsoft.Json.JsonConvert.SerializeObject(state));
        }
        void LoadSavedState()
        {
            var stateFile = $"{DATA_FOLDER}\\{STATE_FILE}";
            if (!System.IO.Directory.Exists(DATA_FOLDER))
            {
                System.IO.Directory.CreateDirectory(DATA_FOLDER);
                System.IO.Directory.CreateDirectory($"{DATA_FOLDER}\\{FILES_FOLDER}");
            }
            foreach (var f in System.IO.Directory.GetFiles($"{DATA_FOLDER}\\{FILES_FOLDER}").OrderBy(x => x))
            {
                var fi = new System.IO.FileInfo(f);
                var li = new ListViewItem(fi.Name.Substring(0, fi.Name.Length - fi.Extension.Length));
                li.Tag = f;
                listFiles.Items.Add(li);
            }
            WorkState state;
            if (!System.IO.File.Exists(stateFile))
            {
                state = new WorkState();
                System.IO.File.WriteAllText(stateFile, Newtonsoft.Json.JsonConvert.SerializeObject(state));
            }
            else
            {
                try
                {
                    state = Newtonsoft.Json.JsonConvert.DeserializeObject<WorkState>(System.IO.File.ReadAllText(stateFile));
                    if (state.WindowSize.Width != -1)
                    {
                        this.ClientSize = state.WindowSize;
                        if (state.SplitMainPosition != -1)
                            this.splitMain.SplitterDistance = state.SplitMainPosition;
                        if (state.SplitRightPosition != -1)
                            this.splitRight.SplitterDistance = state.SplitRightPosition;
                        if (state.SplitTextPosition != -1)
                            this.splitText.SplitterDistance = state.SplitTextPosition;
                        if (state.WindowLocation.X != -1)
                            this.Location = state.WindowLocation;

                    }
                }
                catch
                {
                    state = new WorkState();
                }
            }
            if (state.OpenFile != null)
            {
                foreach (ListViewItem item in this.listFiles.Items)
                {
                    if ((string)item.Tag == state.OpenFile)
                    {
                        item.Selected = true;
                        break;
                    }
                }
            }

        }
        void loadFile(string file)
        {
            if (file == fileName)
                return;
            if (file == null)
                fileName = null;
            else
            {
                try
                {
                    if (!System.IO.File.Exists(file))
                    {
                        fileName = null;
                        return;
                    }
                    fileName = file;

                    exp = Newtonsoft.Json.JsonConvert.DeserializeObject<ExpressionSystem>(
                        System.IO.File.ReadAllText(file));
                    populateExp();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error loading saved expression.{ex.ToString()}");
                }
            }
        }
        void populateExp()
        {
            if (exp == null)
                exp = new ExpressionSystem();

            var i = 0;
            expIndex.Clear();
            foreach (var e in exp.SupportExpressions)
            {
                expIndex.Add(e.Name.ToLower(), i);
                i++;
            }
            LoadToForm();
            SelectMain();
        }
        private void TextExpression_SelectionChanged(object sender, EventArgs e)
        {
            if (ignoreSelectionChange)
                return;
        }

        bool ignoreExpTextChanged = false;
        
        private void TextExpression_TextChanged(object sender, EventArgs e)
        {
            if (ignoreExpTextChanged)
                return;
            clearSyntaxHighlight();
            if (selected == null)
                exp.MainExpression = textExpression.Text;
            else
            {
                selected.Expression = textExpression.Text;
            }
        }
        
        void SyncParse()
        {
            ignoreExpTextChanged = true;
            try
            {
                clearSyntaxHighlight();
                //SendMessage(textExpression.Handle, 0xb, (IntPtr)0, IntPtr.Zero);
                treeView.BeginUpdate();
                var f = textExpression.Text;
                if (selected == null)
                    exp.MainExpression = f;
                else
                    selected.Expression = f;
                

                var serror = new List<FuncScriptParser.SyntaxErrorData>();
                var parsed = FuncScriptParser.Parse(this, f, out var node, serror);
                SyntaxHighlight(node);
                treeView.Nodes.Clear();
                PopulateTree(f, treeView.Nodes, node);
                labelValue.Text = "";
                
                callStack.Clear();
                var res = FuncScript.Evaluate(f, this);
                var sb = new StringBuilder();
                FuncScript.Format(sb, res, null, false, false);
                var text = sb.ToString();
                labelValue.Text = text;
                if (tabResult.SelectedTab == tabHtmlResult)
                {
                    webView.NavigateToString(text);
                    htmlTabUpdate = true;
                }
                else
                    htmlTabUpdate = false;

            }
            catch (Exception ex)
            {
                String msg = null;
                while (ex != null)
                {
                    String thisMessage = null;
                    if(ex is SyntaxError)
                    {
                        thisMessage = ShowSyntaxError((SyntaxError)ex);   
                    }
                    else if (ex is EvaluationException)
                    {
                        thisMessage = ShowEvaluationError((EvaluationException)ex);
                    }
                    
                    else
                        thisMessage = ex.Message;
                    msg = msg == null ? thisMessage : $"{msg}\n{thisMessage}";
                    ex = ex.InnerException;
                }
                labelValue.Text = msg;
                treeView.Nodes.Clear();

            }
            finally
            {
                ignoreExpTextChanged = false;
                //SendMessage(textExpression.Handle, 0xb, (IntPtr)1, IntPtr.Zero);
                textExpression.Invalidate();
                treeView.EndUpdate();
                treeView.Invalidate();
            }
        }

        void Evaluate(String f)
        {
        }
       

        private String ShowEvaluationError(EvaluationException eval)
        {
            string msg = eval.Message;
            var si = textExpression.SelectionStart;
            var sl = textExpression.SelectionLength;
            try
            {
                textExpression.SelectionStart = eval.Pos;
                textExpression.SelectionLength = eval.Len;
                textExpression.SelectionColor = Color.Red;
            }
            finally
            {
                textExpression.SelectionStart = si;
                textExpression.SelectionLength = sl;
            }
            return msg;
        }
        private string  ShowSyntaxError(SyntaxError eval)
        {
            string msg = eval.Message;
            var si = textExpression.SelectionStart;
            var sl = textExpression.SelectionLength;
            try
            {
                foreach (var d in eval.data)
                {
                    msg += "\n" + d.Message;
                    if (d.Loc < textExpression.TextLength)
                    {
                        textExpression.SelectionStart = d.Loc;
                        textExpression.SelectionLength = 1;
                        textExpression.SelectionColor = Color.Red;
                    }
                }
                return msg;
            }
            finally
            {
                textExpression.SelectionStart = si;
                textExpression.SelectionLength = sl;
            }
        }

        bool ignoreSelectionChange = false;
        bool highlighted = false;
        void clearSyntaxHighlight()
        {
            if (!highlighted)
                return;
            ignoreSelectionChange = true;
            try
            {

                var selec = textExpression.SelectionStart;
                var selecLen = textExpression.SelectionLength;
                textExpression.SelectAll();
                textExpression.SelectionColor = Color.Black;
                textExpression.SelectionStart = selec;
                textExpression.SelectionLength = selecLen;
                highlighted = false;
            }
            finally
            {
                ignoreSelectionChange = false;
            }

        }
        private void SyntaxHighlight(FuncScriptParser.ParseNode node)
        {
            if (node == null)
            {
                clearSyntaxHighlight();
                return;
            }
            if (node.Childs != null && node.Childs.Count == 1)
            {
                SyntaxHighlight(node.Childs[0]);
                return;
            }
            
            if (node.Childs != null && node.Childs.Count > 0)
            {
                foreach (var ch in node.Childs)
                {
                    SyntaxHighlight(ch);
                }
            }
            else
            {
                ignoreSelectionChange = true;
                try
                {

                    var selec = textExpression.SelectionStart;
                    var selecLen = textExpression.SelectionLength;
                    textExpression.SelectionStart = node.Pos;
                    textExpression.SelectionLength = node.Length;
                    switch (node.NodeType)
                    {
                        case FuncScriptParser.ParseNodeType.Key:
                            textExpression.SelectionColor = Color.DarkGreen;
                            break;
                        case FuncScriptParser.ParseNodeType.Identifier:
                            textExpression.SelectionColor = Color.DarkCyan;
                            break;
                        case FuncScriptParser.ParseNodeType.KeyWord:
                            textExpression.SelectionColor = Color.Blue;
                            break;
                        case FuncScriptParser.ParseNodeType.LiteralInteger:
                            textExpression.SelectionColor = Color.Gray;
                            break;
                        case FuncScriptParser.ParseNodeType.LiteralDouble:
                            textExpression.SelectionColor = Color.Brown;
                            break;
                        case FuncScriptParser.ParseNodeType.LiteralString:
                            textExpression.SelectionColor = Color.RosyBrown;
                            break;
                        default:
                            textExpression.SelectionColor = Color.Black;
                            break;
                    }
                    highlighted = true;
                    textExpression.SelectionStart = selec;
                    textExpression.SelectionLength = selecLen;
                }
                finally
                {
                    ignoreSelectionChange = false;
                }

            }
        }
        private void PopulateTree(String f,TreeNodeCollection nodes, FuncScriptParser.ParseNode node)
        {
            if (node == null)
            {
                clearSyntaxHighlight();
                return;
            }
            if (node.Childs != null && node.Childs.Count == 1)
            {
                PopulateTree(f,nodes, node.Childs[0]);
                return;
            }
            var nodeText = node.NodeType.ToString();
            if (node.Length > EXP_NODE_PREVIEW)
            {
                nodeText += " " + f.Substring(node.Pos, EXP_NODE_PREVIEW) + "..";
            }
            else
                nodeText += " " + f.Substring(node.Pos, node.Length);
            var n = new TreeNode(nodeText);
            n.Tag = node;
            n.ToolTipText = f.Substring(node.Pos, node.Length);
            nodes.Add(n);
            
            if (node.Childs != null && node.Childs.Count > 0)
            {
                foreach (var ch in node.Childs)
                {
                    PopulateTree(f,n.Nodes, ch);
                }
            }
            if (n.Nodes.Count > 0)
                n.Expand();
        }
        private void listVariables_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (listVariables.SelectedItems.Count == 0)
            {
                SelectMain();
                return;
            }
            var tag = listVariables.SelectedItems[0].Tag as VariableItem;
            if (tag == null)
                SelectMain();
            else
                SelectItem(tag);
        }

        private void buttonAdd_Click(object sender, EventArgs e)
        {
            String name = "no_name";
            var n = 1;
            while (expIndex.ContainsKey(name))
                name = $"{name}_{n++}";

            var item = new VariableItem
            {
                Name = name,
                Expression = "",
            };
            exp.SupportExpressions.Add(item);
            expIndex.Add(name.ToLower(), exp.SupportExpressions.Count - 1);
            listVariables.SelectedItems.Clear();
            var li = new ListViewItem(item.Name);
            li.Tag = item;
            listVariables.Items.Add(li);
            li.Selected = true;
            SelectItem(item);
        }

        private void textName_Click(object sender, EventArgs e)
        {

        }

        private void UpdateExpressionName()
        {
            if (selected == null)
                return;
            if (selected.Name.ToLower() == textName.Text.ToLower())
                return;
            if (expIndex.ContainsKey(textName.Text.ToLower()))
            {
                textName.Undo();
                return;
            }
            var lower = selected.Name.ToLower();
            var index = this.expIndex[lower];
            this.expIndex.Remove(selected.Name);
            selected.Name = textName.Text;
            this.expIndex.Add(selected.Name.ToLower(), index);
            if (listVariables.SelectedItems.Count > 0)
            {
                listVariables.SelectedItems[0].Text = selected.Name;
            }
        }

        private void textError_TextChanged(object sender, EventArgs e)
        {
            
        }

        HashSet<String> callStack = new HashSet<string>();
        public object GetData(string name)
        {
            if (!this.expIndex.ContainsKey(name))
                return globalProvider.GetData(name);

            if (callStack.Contains(name))
            {
                labelValue.Text = $"Circular reference: {name}";
                return null;
            }

            callStack.Add(name);
            try
            {
                var item = this.expIndex[name];
                var res = FuncScript.Evaluate(exp.SupportExpressions[item].Expression,this);
                return res;
            }
            catch (Exception ex)
            {
                labelValue.Text = ex.Message;
                return null;
            }
            finally
            {
                callStack.Remove(name);
            }
        }
        void SaveCurrent()
        {
            if (fileName == null)
                return;
            System.IO.File.WriteAllText(fileName, Newtonsoft.Json.JsonConvert.SerializeObject(exp));
        }
        private void buttonAddFile_Click(object sender, EventArgs e)
        {
            var d = new FileName();
            if (d.ShowDialog(this) == DialogResult.OK)
            {
                SaveCurrent();
                this.fileName = $"{DATA_FOLDER}\\{FILES_FOLDER}\\{d.InputText}.json";
                exp = new ExpressionSystem();
                var li = new ListViewItem(d.InputText);
                li.Tag = this.fileName;
                listFiles.Items.Add(li);
                populateExp();
            }
        }

        private void listFiles_SelectedIndexChanged(object sender, EventArgs e)
        {

        }

        private void listFiles_DoubleClick(object sender, EventArgs e)
        {
            if (listFiles.SelectedItems.Count == 0)
                return;
            var li = listFiles.SelectedItems[0];
            var fi = new System.IO.FileInfo((string)li.Tag);

            var d = new FileName(fi.Name.Substring(0, fi.Name.Length - fi.Extension.Length));
            if (d.ShowDialog(this) == DialogResult.OK)
            {
                var fn = $"{DATA_FOLDER}\\{FILES_FOLDER}\\{d.InputText}.json";
                System.IO.File.Move(fi.FullName, fn);
                li.Text = d.InputText;
                li.Tag = fn;
                this.fileName = fn;
            }
        }

        private void buttonDelete_Click(object sender, EventArgs e)
        {
            if (MessageBox.Show("Are you sure you want to delete this item?", "Delete Item", MessageBoxButtons.YesNo) != DialogResult.Yes)
                return;
            var hasSelection = listFiles.SelectedItems.Count > 0;
            if (!hasSelection)
                return;
            System.IO.File.Delete(fileName);
            fileName = null;
            exp = null;
            listFiles.SelectedItems[0].Remove();

        }
        public void DumpException(Exception ex)
        {
            if (ex is AggregateException)
            {
                foreach (var inner in ((AggregateException)ex).InnerExceptions)
                    DumpException(inner);
            }
            else
            {
                var prefix = "";
                this.labelValue.Text = "";
                while (ex != null)
                {
                    this.labelValue.Text += $"{prefix}{ex.ToString()}\n";
                    this.labelValue.Text += $"{ex.StackTrace}\n";
                    ex = ex.InnerException;
                    prefix = ">" + prefix;
                }
            }
        }
        private void buttonAPI_Click(object sender, EventArgs e)
        {
            if (exp == null)
                return;
            EvaluateWithAPI(exp.MainExpression);
        }
        void EvaluateWithAPI(string f)
        {
            int par;
            if (!expIndex.TryGetValue("pars", out par))
                par = -1;
            var d = new CallAPI("root", "pass", Guid.Empty, f, par == -1 ? null : this.exp.SupportExpressions[par].Expression);
            d.ShowDialog(this);
            if (d.Error != null)
            {
                DumpException(d.Error);
            }
            else
            {
                this.labelValue.Text = d.Result;
                if (tabResult.SelectedTab == tabHtmlResult)
                {
                    webView.NavigateToString(d.Result);
                    htmlTabUpdate = true;
                }
                else
                    htmlTabUpdate = false;

            }
        }

        private void buttonSync_Click(object sender, EventArgs e)
        {
            SyncParse();
        }

        FuncScriptParser.ParseNode SelectedParseNode = null;
        private void treeView_AfterSelect(object sender, TreeViewEventArgs e)
        {
            var sel = textExpression.SelectionStart;
            var selLen = textExpression.SelectionLength;
            try
            {
                if (SelectedParseNode != null)
                {
                    textExpression.SelectionStart = SelectedParseNode.Pos;
                    textExpression.SelectionLength = SelectedParseNode.Length;
                    textExpression.SelectionFont = new Font(CODE_FONT_NAME, CODE_FONT_SIZE);
                }
                SelectedParseNode = e.Node.Tag as FuncScriptParser.ParseNode;
                if (SelectedParseNode != null)
                {
                    textExpression.SelectionStart = SelectedParseNode.Pos;
                    textExpression.SelectionLength = SelectedParseNode.Length;
                    textExpression.SelectionFont = new Font(CODE_FONT_NAME, CODE_FONT_SIZE, FontStyle.Underline);
                }
            }
            finally
            {
                textExpression.SelectionStart = sel;
                textExpression.SelectionLength = selLen;
            }
        }

        private void contextTree_Opening(object sender, CancelEventArgs e)
        {
            itemCopyNode.Enabled = SelectedParseNode != null;
            evaluateToolStripMenuItem.Enabled = SelectedParseNode != null;
            evaluateWithAPIToolStripMenuItem.Enabled = SelectedParseNode != null;
        }

        private void itemCopyNode_Click(object sender, EventArgs e)
        {
            if (SelectedParseNode != null)
            {
                
                //Clipboard.SetText(_onTree.Substring(SelectedParseNode.Pos, SelectedParseNode.Length));
            }
        }

        private void textName_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                UpdateExpressionName();
            }
        }

        private void textName_Leave(object sender, EventArgs e)
        {
            UpdateExpressionName();

        }

        private void evaluateToolStripMenuItem_Click(object sender, EventArgs e)
        {
            if (SelectedParseNode != null)
            {
                //Evaluate(_onTree.Substring(SelectedParseNode.Pos, SelectedParseNode.Length));
            }
        }

        private void evaluateWithAPIToolStripMenuItem_Click(object sender, EventArgs e)
        {
            if (SelectedParseNode != null)
            {
                //EvaluateWithAPI(_onTree.Substring(SelectedParseNode.Pos, SelectedParseNode.Length));
            }
        }

        private async void MainWindow_Load(object sender, EventArgs e)
        {
            await webView.EnsureCoreWebView2Async();
        }

        bool htmlTabUpdate = false;
        private void tabResult_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (tabResult.SelectedTab == tabHtmlResult && !htmlTabUpdate)
            {
                webView.NavigateToString(labelValue.Text);
                htmlTabUpdate = true;
            }
        }

        private void buttonShowTree_Click(object sender, EventArgs e)
        {

            var list = new List<FuncScriptParser.SyntaxErrorData>();
            var exp = textExpression.Text;
            funcscript.core.FuncScriptParser.Parse(globalProvider, exp, out var node,list);
            PopulateTree(exp,treeView.Nodes, node);
        }

        private void buttonCopy_Click(object sender, EventArgs e)
        {
            try
            {
                Clipboard.SetText(labelValue.Text);
                MessageBox.Show("Coppied","FuncScript");
            }
            catch(Exception ex)
            {
                MessageBox.Show(ex.Message, "FuncScript");
            }
        }
    }
    class NoflickerTree : TreeView
    {
        public NoflickerTree()
        {
            this.SetStyle(ControlStyles.OptimizedDoubleBuffer, true);
        }
    }
    class NoFilckerRichTextBox : RichTextBox
    {
        public NoFilckerRichTextBox()
        {
            this.SetStyle(ControlStyles.OptimizedDoubleBuffer, true);
        }
    }

}