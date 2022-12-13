using Newtonsoft.Json;
using orch.core.model;
using orch.utils.web;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Net.Http.Json;
using System.Runtime.Intrinsics.Arm;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace fsstudio
{
    
    public partial class CallAPI : Form
    {
        public String UserName;
        public String Password;
        public Guid AccessToken;
        public String Result=null;
        public Exception Error=null;
        String _exp;
        String _par;
        public CallAPI(String userName,String password,Guid accessToken,String exp,String par)
        {
            InitializeComponent();
            this._exp = exp;
            this._par = par;

            this.UserName= userName;
            this.Password=password; ;
            this.AccessToken = accessToken;
            
            this.textName.Text = userName;
            this.textPassword.Text = password;
        }

        private void CallAPI_Load(object sender, EventArgs e)
        {

        }
        void UpdateAPIStatus(String status)
        {
            labelStatus.Text=status; ;
        }
        void Done()
        {
            this.Close();
        }
        void Failed()
        {
            this.Enabled = true;
        }
        async Task invokeApi()
        {
            this.Invoke(UpdateAPIStatus, "Invoking API");
            var request = $"/api/query?access_token={this.AccessToken}&query={System.Web.HttpUtility.UrlEncode(this._exp)}";
            if (this._par != null)
                request = $"{request}&pars={System.Web.HttpUtility.UrlEncode(this._par)}";
            try
            {
                var ret = await API.ApiGetAsync<object>(request);
                this.Result = ret==null?"null":ret.ToString();
                this.Invoke(Done);
            }
            catch(Exception ex)
            {
                this.Error = ex;
                this.Invoke(Done);
            }
        }
        public class CreateAccessTokenRequest
        {
            public String UserName { get; set; }
            public String Password { get; set; }
            public String ClientInfo { get; set; }
        }
        public class AccessTokeInfo
        {
            public bool Valid { get; set; }
            public AccessToken Info { get; set; }
        }
        private void buttonOk_Click(object sender, EventArgs e)
        {
            this.Enabled = false;

            this.UserName = textName.Text;
            this.Password = textPassword.Text;
            
                new System.Threading.Thread(new System.Threading.ThreadStart(async () =>
                 {
                     if (this.AccessToken != Guid.Empty)
                     {
                         this.Invoke(UpdateAPIStatus, "Checking access token");
                         var at = await API.ApiGetAsync<AccessTokeInfo>("/api/system/access-token");
                         if (at.Valid)
                         {
                             await invokeApi();
                             return;
                         }
                     }
                     this.Invoke(UpdateAPIStatus, "Token not valid. Trying to get new token");
                     try
                     {
                         var res = await API.ApiPostWithReturn<Guid, CreateAccessTokenRequest>
                         ("/api/system/access-token", new CreateAccessTokenRequest
                         {
                             UserName = this.UserName,
                             Password = this.Password,
                             ClientInfo = null
                         });
                         this.AccessToken = res;
                         await invokeApi();
                     }
                     catch(Exception ex)
                     {
                         this.Invoke(UpdateAPIStatus, $"Login failed:{ex.Message}");
                         this.Invoke(Failed);
                     }

                 })).Start();
            
        }

    }
    class API
    {
        private static async Task HandleError(HttpResponseMessage res)
        {
            if (res.StatusCode == System.Net.HttpStatusCode.OK)
                return;
            var error = await res.Content.ReadAsStringAsync();
            ErrorInfo errorInfo;
            try
            {
                errorInfo = Newtonsoft.Json.JsonConvert.DeserializeObject<ErrorInfo>(error);
            }
            catch
            {
                errorInfo = null;
            }

            if (errorInfo != null)
            {
                String msg = errorInfo.Error;
                if (errorInfo.Exceptions != null)
                {
                    var prefix = "";
                    foreach (var d in errorInfo.Exceptions)
                    {
                        if (msg == null)
                            msg = $"{d.Message}\n{d.StackTrace}";
                        else
                        {
                            prefix += ">";
                            msg += $"\n{prefix}{d.Message}\n{d.StackTrace}";
                        }
                    }
                }
                throw new Exception(msg);
            }
            throw new Exception("Unknown error");
        }
        public static async Task<T> ApiGetAsync<T>(string url)
        {
            var client = new HttpClient();
            client.BaseAddress = new Uri(Program.ApiUrl);
            var res = await client.GetAsync(url);
            await HandleError(res);
            return await res.Content.ReadFromJsonAsync<T>();
        }
        public static async Task<ReturnType> ApiPostWithReturn<ReturnType, PostType>(string url, PostType data)
        {
            var client = new HttpClient();
            client.BaseAddress = new Uri(Program.ApiUrl);
            var res = await client.PostAsJsonAsync(url, data);
            await HandleError(res);
            var str = await res.Content.ReadAsStringAsync();
            var ret = JsonConvert.DeserializeObject<ReturnType>(str);
            return ret;
        }
    }
}
