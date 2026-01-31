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
        public static async Task<string?> GetOtpTemplateAsync(IStaticValueRepository repo, string otp)
        {
            if (repo == null) throw new ArgumentNullException(nameof(repo));
            if (string.IsNullOrEmpty(otp)) throw new ArgumentNullException(nameof(otp));

            var filter = new StaticValueFilter
            {
                key = "OPTTemplate"
            };
            var item = await repo.GetSingleAsync(filter);
            if (item == null) return null;
            string template = item.StaticData ?? ""; 
            template = template.Replace("#OPTRANVAL#", otp);
            return template;
        }
    }
}
