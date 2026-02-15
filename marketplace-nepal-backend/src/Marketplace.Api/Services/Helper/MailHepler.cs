using Marketpalce.Repository.Repositories.StaticValueReop;
using Marketplace.Model.Models;
using System;
using System.Threading.Tasks;

namespace Marketplace.Api.Services.Helper
{
    public static class MailHelper
    {
        /// <summary>
        /// Get OTP email template and replace #OPTRANVAL# with actual OTP value
        /// </summary>
        /// <param name="repo">Static value repository</param>
        /// <param name="otp">The OTP value to insert</param>
        /// <returns>Final HTML string</returns>
        public static async Task<string?> GetTemplateAsync(
       IStaticValueRepository repo,
       string templateKey,
       Dictionary<string, string> placeholders)
        {
            if (repo == null) throw new ArgumentNullException(nameof(repo));
            if (string.IsNullOrWhiteSpace(templateKey))
                throw new ArgumentNullException(nameof(templateKey));

            var filter = new StaticValueFilter
            {
                key = templateKey   // now dynamic
            };

            var item = await repo.GetSingleAsync(filter);
            if (item == null) return null;

            string template = @"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <title>Password Reset</title>
</head>
<body style=""margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f4f4;"">
    <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#f4f4f4; padding: 30px 0;"">
        <tr>
            <td align=""center"">
                <!-- Main container -->
                <table width=""600"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#ffffff; border-radius:8px; overflow:hidden;"">
                    <!-- Logo -->
                    <tr>
                        <td align=""center"" style=""padding: 20px 0; background-color:#1e1e3f;"">
                            <span style=""font-size:20px; color:#ffffff; font-weight:bold;"">YOUR</span> 
                            <span style=""font-size:20px; color:#ffffff;"">LOGO</span>
                        </td>
                    </tr>
";


            template+=item.StaticData ?? "";
            template += @"
                    <!-- Footer -->
                    <tr>
                        <td style=""background-color:#1e1e3f; color:#ffffff; padding:20px 30px; font-size:14px;"">
                            <p style=""margin:0;"">Contact:test, FL 11223 | +977 9999 999 | info@nepaldistributors.com</p>
                            <p style=""margin:5px 0 0 0;"">
                                <a href=""#"" style=""color:#ffffff; text-decoration:none; margin-right:10px;"">Facebook</a>
                                <a href=""#"" style=""color:#ffffff; text-decoration:none; margin-right:10px;"">Twitter</a>
                                <a href=""#"" style=""color:#ffffff; text-decoration:none; margin-right:10px;"">Instagram</a>
                                <a href=""#"" style=""color:#ffffff; text-decoration:none;"">LinkedIn</a>
                            </p>
                            <p style=""margin:10px 0 0 0; font-size:12px;"">Company © All Rights Reserved</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
";

            // Replace all placeholders dynamically (supports multiple occurrences)
            if (placeholders != null)
            {
                foreach (var pair in placeholders)
                {
                    template = template.Replace(pair.Key, pair.Value);
                }
            }

            return template;
        }

    }
}
