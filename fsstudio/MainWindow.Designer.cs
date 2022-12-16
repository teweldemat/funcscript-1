namespace fsstudio
{
    partial class MainWindow
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(MainWindow));
            this.splitMain = new System.Windows.Forms.SplitContainer();
            this.splitContainer2 = new System.Windows.Forms.SplitContainer();
            this.listFiles = new System.Windows.Forms.ListView();
            this.toolStrip2 = new System.Windows.Forms.ToolStrip();
            this.buttonAddFile = new System.Windows.Forms.ToolStripButton();
            this.buttonDeleteFile = new System.Windows.Forms.ToolStripButton();
            this.treeView = new fsstudio.NoflickerTree();
            this.contextTree = new System.Windows.Forms.ContextMenuStrip(this.components);
            this.itemCopyNode = new System.Windows.Forms.ToolStripMenuItem();
            this.evaluateToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.evaluateWithAPIToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.splitRight = new System.Windows.Forms.SplitContainer();
            this.splitText = new System.Windows.Forms.SplitContainer();
            this.textExpression = new fsstudio.NoFilckerRichTextBox();
            this.toolStrip1 = new System.Windows.Forms.ToolStrip();
            this.textName = new System.Windows.Forms.ToolStripTextBox();
            this.buttonAdd = new System.Windows.Forms.ToolStripButton();
            this.comboUser = new System.Windows.Forms.ToolStripComboBox();
            this.buttonAPI = new System.Windows.Forms.ToolStripButton();
            this.buttonSync = new System.Windows.Forms.ToolStripButton();
            this.tabResult = new System.Windows.Forms.TabControl();
            this.tabTexResult = new System.Windows.Forms.TabPage();
            this.labelValue = new System.Windows.Forms.RichTextBox();
            this.tabHtmlResult = new System.Windows.Forms.TabPage();
            this.webView = new Microsoft.Web.WebView2.WinForms.WebView2();
            this.listVariables = new System.Windows.Forms.ListView();
            this.buttonCopy = new System.Windows.Forms.ToolStripButton();
            ((System.ComponentModel.ISupportInitialize)(this.splitMain)).BeginInit();
            this.splitMain.Panel1.SuspendLayout();
            this.splitMain.Panel2.SuspendLayout();
            this.splitMain.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.splitContainer2)).BeginInit();
            this.splitContainer2.Panel1.SuspendLayout();
            this.splitContainer2.Panel2.SuspendLayout();
            this.splitContainer2.SuspendLayout();
            this.toolStrip2.SuspendLayout();
            this.contextTree.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.splitRight)).BeginInit();
            this.splitRight.Panel1.SuspendLayout();
            this.splitRight.Panel2.SuspendLayout();
            this.splitRight.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.splitText)).BeginInit();
            this.splitText.Panel1.SuspendLayout();
            this.splitText.Panel2.SuspendLayout();
            this.splitText.SuspendLayout();
            this.toolStrip1.SuspendLayout();
            this.tabResult.SuspendLayout();
            this.tabTexResult.SuspendLayout();
            this.tabHtmlResult.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.webView)).BeginInit();
            this.SuspendLayout();
            // 
            // splitMain
            // 
            this.splitMain.Dock = System.Windows.Forms.DockStyle.Fill;
            this.splitMain.FixedPanel = System.Windows.Forms.FixedPanel.Panel1;
            this.splitMain.Location = new System.Drawing.Point(0, 0);
            this.splitMain.Name = "splitMain";
            // 
            // splitMain.Panel1
            // 
            this.splitMain.Panel1.Controls.Add(this.splitContainer2);
            // 
            // splitMain.Panel2
            // 
            this.splitMain.Panel2.Controls.Add(this.splitRight);
            this.splitMain.Size = new System.Drawing.Size(1469, 582);
            this.splitMain.SplitterDistance = 536;
            this.splitMain.TabIndex = 0;
            // 
            // splitContainer2
            // 
            this.splitContainer2.Dock = System.Windows.Forms.DockStyle.Fill;
            this.splitContainer2.Location = new System.Drawing.Point(0, 0);
            this.splitContainer2.Name = "splitContainer2";
            // 
            // splitContainer2.Panel1
            // 
            this.splitContainer2.Panel1.Controls.Add(this.listFiles);
            this.splitContainer2.Panel1.Controls.Add(this.toolStrip2);
            // 
            // splitContainer2.Panel2
            // 
            this.splitContainer2.Panel2.Controls.Add(this.treeView);
            this.splitContainer2.Size = new System.Drawing.Size(536, 582);
            this.splitContainer2.SplitterDistance = 278;
            this.splitContainer2.TabIndex = 1;
            // 
            // listFiles
            // 
            this.listFiles.Dock = System.Windows.Forms.DockStyle.Fill;
            this.listFiles.FullRowSelect = true;
            this.listFiles.Location = new System.Drawing.Point(0, 34);
            this.listFiles.Name = "listFiles";
            this.listFiles.Size = new System.Drawing.Size(278, 548);
            this.listFiles.TabIndex = 1;
            this.listFiles.UseCompatibleStateImageBehavior = false;
            this.listFiles.View = System.Windows.Forms.View.List;
            this.listFiles.SelectedIndexChanged += new System.EventHandler(this.listFiles_SelectedIndexChanged);
            this.listFiles.DoubleClick += new System.EventHandler(this.listFiles_DoubleClick);
            // 
            // toolStrip2
            // 
            this.toolStrip2.ImageScalingSize = new System.Drawing.Size(24, 24);
            this.toolStrip2.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.buttonAddFile,
            this.buttonDeleteFile});
            this.toolStrip2.Location = new System.Drawing.Point(0, 0);
            this.toolStrip2.Name = "toolStrip2";
            this.toolStrip2.Size = new System.Drawing.Size(278, 34);
            this.toolStrip2.TabIndex = 0;
            this.toolStrip2.Text = "toolStrip2";
            // 
            // buttonAddFile
            // 
            this.buttonAddFile.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Text;
            this.buttonAddFile.Image = ((System.Drawing.Image)(resources.GetObject("buttonAddFile.Image")));
            this.buttonAddFile.ImageTransparentColor = System.Drawing.Color.Magenta;
            this.buttonAddFile.Name = "buttonAddFile";
            this.buttonAddFile.Size = new System.Drawing.Size(38, 29);
            this.buttonAddFile.Text = "[+]";
            this.buttonAddFile.Click += new System.EventHandler(this.buttonAddFile_Click);
            // 
            // buttonDeleteFile
            // 
            this.buttonDeleteFile.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Text;
            this.buttonDeleteFile.Image = ((System.Drawing.Image)(resources.GetObject("buttonDeleteFile.Image")));
            this.buttonDeleteFile.ImageTransparentColor = System.Drawing.Color.Magenta;
            this.buttonDeleteFile.Name = "buttonDeleteFile";
            this.buttonDeleteFile.Size = new System.Drawing.Size(34, 29);
            this.buttonDeleteFile.Text = "[-]";
            this.buttonDeleteFile.Click += new System.EventHandler(this.buttonDelete_Click);
            // 
            // treeView
            // 
            this.treeView.ContextMenuStrip = this.contextTree;
            this.treeView.Dock = System.Windows.Forms.DockStyle.Fill;
            this.treeView.Location = new System.Drawing.Point(0, 0);
            this.treeView.Name = "treeView";
            this.treeView.Size = new System.Drawing.Size(254, 582);
            this.treeView.TabIndex = 0;
            this.treeView.AfterSelect += new System.Windows.Forms.TreeViewEventHandler(this.treeView_AfterSelect);
            // 
            // contextTree
            // 
            this.contextTree.ImageScalingSize = new System.Drawing.Size(24, 24);
            this.contextTree.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.itemCopyNode,
            this.evaluateToolStripMenuItem,
            this.evaluateWithAPIToolStripMenuItem});
            this.contextTree.Name = "contextTree";
            this.contextTree.Size = new System.Drawing.Size(220, 100);
            this.contextTree.Opening += new System.ComponentModel.CancelEventHandler(this.contextTree_Opening);
            // 
            // itemCopyNode
            // 
            this.itemCopyNode.Name = "itemCopyNode";
            this.itemCopyNode.Size = new System.Drawing.Size(219, 32);
            this.itemCopyNode.Text = "Copy Expression";
            this.itemCopyNode.Click += new System.EventHandler(this.itemCopyNode_Click);
            // 
            // evaluateToolStripMenuItem
            // 
            this.evaluateToolStripMenuItem.Name = "evaluateToolStripMenuItem";
            this.evaluateToolStripMenuItem.Size = new System.Drawing.Size(219, 32);
            this.evaluateToolStripMenuItem.Text = "Evaluate";
            this.evaluateToolStripMenuItem.Click += new System.EventHandler(this.evaluateToolStripMenuItem_Click);
            // 
            // evaluateWithAPIToolStripMenuItem
            // 
            this.evaluateWithAPIToolStripMenuItem.Name = "evaluateWithAPIToolStripMenuItem";
            this.evaluateWithAPIToolStripMenuItem.Size = new System.Drawing.Size(219, 32);
            this.evaluateWithAPIToolStripMenuItem.Text = "Evaluate with API";
            this.evaluateWithAPIToolStripMenuItem.Click += new System.EventHandler(this.evaluateWithAPIToolStripMenuItem_Click);
            // 
            // splitRight
            // 
            this.splitRight.Dock = System.Windows.Forms.DockStyle.Fill;
            this.splitRight.FixedPanel = System.Windows.Forms.FixedPanel.Panel2;
            this.splitRight.Location = new System.Drawing.Point(0, 0);
            this.splitRight.Name = "splitRight";
            // 
            // splitRight.Panel1
            // 
            this.splitRight.Panel1.Controls.Add(this.splitText);
            // 
            // splitRight.Panel2
            // 
            this.splitRight.Panel2.Controls.Add(this.listVariables);
            this.splitRight.Size = new System.Drawing.Size(929, 582);
            this.splitRight.SplitterDistance = 591;
            this.splitRight.TabIndex = 2;
            // 
            // splitText
            // 
            this.splitText.Dock = System.Windows.Forms.DockStyle.Fill;
            this.splitText.FixedPanel = System.Windows.Forms.FixedPanel.Panel2;
            this.splitText.Location = new System.Drawing.Point(0, 0);
            this.splitText.Name = "splitText";
            this.splitText.Orientation = System.Windows.Forms.Orientation.Horizontal;
            // 
            // splitText.Panel1
            // 
            this.splitText.Panel1.Controls.Add(this.textExpression);
            this.splitText.Panel1.Controls.Add(this.toolStrip1);
            // 
            // splitText.Panel2
            // 
            this.splitText.Panel2.Controls.Add(this.tabResult);
            this.splitText.Size = new System.Drawing.Size(591, 582);
            this.splitText.SplitterDistance = 365;
            this.splitText.TabIndex = 1;
            // 
            // textExpression
            // 
            this.textExpression.AcceptsTab = true;
            this.textExpression.Dock = System.Windows.Forms.DockStyle.Fill;
            this.textExpression.Location = new System.Drawing.Point(0, 34);
            this.textExpression.Name = "textExpression";
            this.textExpression.Size = new System.Drawing.Size(591, 331);
            this.textExpression.TabIndex = 0;
            this.textExpression.Text = "";
            // 
            // toolStrip1
            // 
            this.toolStrip1.ImageScalingSize = new System.Drawing.Size(24, 24);
            this.toolStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.textName,
            this.buttonAdd,
            this.comboUser,
            this.buttonSync,
            this.buttonAPI,
            this.buttonCopy});
            this.toolStrip1.Location = new System.Drawing.Point(0, 0);
            this.toolStrip1.Name = "toolStrip1";
            this.toolStrip1.Size = new System.Drawing.Size(591, 34);
            this.toolStrip1.TabIndex = 1;
            this.toolStrip1.Text = "toolStrip1";
            // 
            // textName
            // 
            this.textName.Name = "textName";
            this.textName.Size = new System.Drawing.Size(300, 34);
            this.textName.Leave += new System.EventHandler(this.textName_Leave);
            this.textName.KeyDown += new System.Windows.Forms.KeyEventHandler(this.textName_KeyDown);
            this.textName.Click += new System.EventHandler(this.textName_Click);
            // 
            // buttonAdd
            // 
            this.buttonAdd.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Text;
            this.buttonAdd.Image = ((System.Drawing.Image)(resources.GetObject("buttonAdd.Image")));
            this.buttonAdd.ImageTransparentColor = System.Drawing.Color.Magenta;
            this.buttonAdd.Name = "buttonAdd";
            this.buttonAdd.Size = new System.Drawing.Size(38, 29);
            this.buttonAdd.Text = "[+]";
            this.buttonAdd.Click += new System.EventHandler(this.buttonAdd_Click);
            // 
            // comboUser
            // 
            this.comboUser.Name = "comboUser";
            this.comboUser.Size = new System.Drawing.Size(121, 34);
            this.comboUser.Visible = false;
            // 
            // buttonAPI
            // 
            this.buttonAPI.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Text;
            this.buttonAPI.Image = ((System.Drawing.Image)(resources.GetObject("buttonAPI.Image")));
            this.buttonAPI.ImageTransparentColor = System.Drawing.Color.Magenta;
            this.buttonAPI.Name = "buttonAPI";
            this.buttonAPI.Size = new System.Drawing.Size(43, 29);
            this.buttonAPI.Text = "API";
            this.buttonAPI.Click += new System.EventHandler(this.buttonAPI_Click);
            // 
            // buttonSync
            // 
            this.buttonSync.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Text;
            this.buttonSync.Image = ((System.Drawing.Image)(resources.GetObject("buttonSync.Image")));
            this.buttonSync.ImageTransparentColor = System.Drawing.Color.Magenta;
            this.buttonSync.Name = "buttonSync";
            this.buttonSync.Size = new System.Drawing.Size(81, 29);
            this.buttonSync.Text = "Evaluate";
            this.buttonSync.Click += new System.EventHandler(this.buttonSync_Click);
            // 
            // tabResult
            // 
            this.tabResult.Controls.Add(this.tabTexResult);
            this.tabResult.Controls.Add(this.tabHtmlResult);
            this.tabResult.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tabResult.Location = new System.Drawing.Point(0, 0);
            this.tabResult.Name = "tabResult";
            this.tabResult.SelectedIndex = 0;
            this.tabResult.Size = new System.Drawing.Size(591, 213);
            this.tabResult.TabIndex = 1;
            this.tabResult.SelectedIndexChanged += new System.EventHandler(this.tabResult_SelectedIndexChanged);
            // 
            // tabTexResult
            // 
            this.tabTexResult.Controls.Add(this.labelValue);
            this.tabTexResult.Location = new System.Drawing.Point(4, 34);
            this.tabTexResult.Name = "tabTexResult";
            this.tabTexResult.Padding = new System.Windows.Forms.Padding(3);
            this.tabTexResult.Size = new System.Drawing.Size(583, 175);
            this.tabTexResult.TabIndex = 0;
            this.tabTexResult.Text = "Text";
            this.tabTexResult.UseVisualStyleBackColor = true;
            // 
            // labelValue
            // 
            this.labelValue.BackColor = System.Drawing.Color.White;
            this.labelValue.Dock = System.Windows.Forms.DockStyle.Fill;
            this.labelValue.Font = new System.Drawing.Font("Arial Narrow", 10F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.labelValue.Location = new System.Drawing.Point(3, 3);
            this.labelValue.Name = "labelValue";
            this.labelValue.ReadOnly = true;
            this.labelValue.Size = new System.Drawing.Size(577, 169);
            this.labelValue.TabIndex = 0;
            this.labelValue.Text = "";
            // 
            // tabHtmlResult
            // 
            this.tabHtmlResult.Controls.Add(this.webView);
            this.tabHtmlResult.Location = new System.Drawing.Point(4, 34);
            this.tabHtmlResult.Name = "tabHtmlResult";
            this.tabHtmlResult.Padding = new System.Windows.Forms.Padding(3);
            this.tabHtmlResult.Size = new System.Drawing.Size(583, 175);
            this.tabHtmlResult.TabIndex = 1;
            this.tabHtmlResult.Text = "HTML";
            this.tabHtmlResult.UseVisualStyleBackColor = true;
            // 
            // webView
            // 
            this.webView.CreationProperties = null;
            this.webView.DefaultBackgroundColor = System.Drawing.Color.White;
            this.webView.Dock = System.Windows.Forms.DockStyle.Fill;
            this.webView.Location = new System.Drawing.Point(3, 3);
            this.webView.Name = "webView";
            this.webView.Size = new System.Drawing.Size(577, 169);
            this.webView.TabIndex = 0;
            this.webView.ZoomFactor = 1D;
            // 
            // listVariables
            // 
            this.listVariables.Dock = System.Windows.Forms.DockStyle.Fill;
            this.listVariables.Location = new System.Drawing.Point(0, 0);
            this.listVariables.Name = "listVariables";
            this.listVariables.Size = new System.Drawing.Size(334, 582);
            this.listVariables.TabIndex = 0;
            this.listVariables.UseCompatibleStateImageBehavior = false;
            this.listVariables.View = System.Windows.Forms.View.List;
            this.listVariables.SelectedIndexChanged += new System.EventHandler(this.listVariables_SelectedIndexChanged);
            // 
            // buttonCopy
            // 
            this.buttonCopy.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Text;
            this.buttonCopy.Image = ((System.Drawing.Image)(resources.GetObject("buttonCopy.Image")));
            this.buttonCopy.ImageTransparentColor = System.Drawing.Color.Magenta;
            this.buttonCopy.Name = "buttonCopy";
            this.buttonCopy.Size = new System.Drawing.Size(110, 29);
            this.buttonCopy.Text = "Copy Result";
            this.buttonCopy.Click += new System.EventHandler(this.buttonCopy_Click);
            // 
            // MainWindow
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(10F, 25F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1469, 582);
            this.Controls.Add(this.splitMain);
            this.DoubleBuffered = true;
            this.Name = "MainWindow";
            this.Text = "FuncScript";
            this.Load += new System.EventHandler(this.MainWindow_Load);
            this.splitMain.Panel1.ResumeLayout(false);
            this.splitMain.Panel2.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)(this.splitMain)).EndInit();
            this.splitMain.ResumeLayout(false);
            this.splitContainer2.Panel1.ResumeLayout(false);
            this.splitContainer2.Panel1.PerformLayout();
            this.splitContainer2.Panel2.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)(this.splitContainer2)).EndInit();
            this.splitContainer2.ResumeLayout(false);
            this.toolStrip2.ResumeLayout(false);
            this.toolStrip2.PerformLayout();
            this.contextTree.ResumeLayout(false);
            this.splitRight.Panel1.ResumeLayout(false);
            this.splitRight.Panel2.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)(this.splitRight)).EndInit();
            this.splitRight.ResumeLayout(false);
            this.splitText.Panel1.ResumeLayout(false);
            this.splitText.Panel1.PerformLayout();
            this.splitText.Panel2.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)(this.splitText)).EndInit();
            this.splitText.ResumeLayout(false);
            this.toolStrip1.ResumeLayout(false);
            this.toolStrip1.PerformLayout();
            this.tabResult.ResumeLayout(false);
            this.tabTexResult.ResumeLayout(false);
            this.tabHtmlResult.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)(this.webView)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private SplitContainer splitMain;
        private SplitContainer splitText;
        private SplitContainer splitRight;
        private ListView listVariables;
        private ToolStrip toolStrip1;
        private ToolStripTextBox textName;
        private ToolStripButton buttonAdd;
        private SplitContainer splitContainer2;
        private ListView listFiles;
        private ToolStrip toolStrip2;
        private ToolStripButton buttonAddFile;
        private ToolStripButton buttonDeleteFile;
        private ToolStripComboBox comboUser;
        private ToolStripButton buttonAPI;
        private RichTextBox labelValue;
        private ToolStripButton buttonSync;
        private ContextMenuStrip contextTree;
        private ToolStripMenuItem itemCopyNode;
        private ToolStripMenuItem evaluateToolStripMenuItem;
        private ToolStripMenuItem evaluateWithAPIToolStripMenuItem;
        private NoflickerTree treeView;
        private NoFilckerRichTextBox textExpression;
        private TabControl tabResult;
        private TabPage tabTexResult;
        private TabPage tabHtmlResult;
        private Microsoft.Web.WebView2.WinForms.WebView2 webView;
        private ToolStripButton buttonCopy;
    }
}