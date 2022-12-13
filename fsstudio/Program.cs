namespace fsstudio
{
    internal static class Program
    {
        public static String ApiUrl;
        /// <summary>
        ///  The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            ApiUrl = System.Configuration.ConfigurationManager.AppSettings["api-endpoint"];
            // To customize application configuration such as set high DPI settings or default font,
            // see https://aka.ms/applicationconfiguration.
            ApplicationConfiguration.Initialize();
            Application.Run(new MainWindow());
        }
    }
}