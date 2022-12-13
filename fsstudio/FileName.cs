using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace fsstudio
{
    public partial class FileName : Form
    {
        public String InputText;
        public FileName(string inputText):this()
        {
            this.InputText=inputText;
        }
        public FileName()
        {
            InitializeComponent();
            this.textName.TextChanged += TextName_TextChanged;
        }

        private void TextName_TextChanged(object sender, EventArgs e)
        {
            if (this.InputText != null)
                buttonOk.Enabled = !string.IsNullOrEmpty(textName.Text.Trim())
                    && this.InputText != textName.Text.Trim();
            else
                buttonOk.Enabled = !string.IsNullOrEmpty(textName.Text.Trim());
        }

        private void buttonOk_Click(object sender, EventArgs e)
        {
            this.InputText = textName.Text.Trim();
            this.DialogResult = DialogResult.OK;
        }

        private void buttonCancel_Click(object sender, EventArgs e)
        {
            this.DialogResult = DialogResult.Cancel;
        }
    }
}
