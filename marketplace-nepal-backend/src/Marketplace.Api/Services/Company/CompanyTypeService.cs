using Marketpalce.Repository.Repositories.ComponyRepo;
using Marketpalce.Repository.Repositories.StaticValueReop;
using Marketplace.Api.Models;
using Marketplace.Api.Services.EmailService;
using Marketplace.Model.Models;
using Marketplace.Models;
using System.Security.Claims;

namespace Marketplace.Api.Services.Company
{
    public class CompanyTypeService : ICompanyTypeService
    {
        private readonly IConfiguration _config;
        private readonly ICompanyTypeRepository _companyTypeRepository;
        private readonly IEmailService _emailService;
        public CompanyTypeService(ICompanyTypeRepository  companyTypeRepository, IEmailService emailService, IConfiguration config)
        {
            _config = config;
            _companyTypeRepository = companyTypeRepository;
            _emailService = emailService;
        }

        public Task<List<StaticValue>> GetCompanyTypesAsync()
        {
            return _companyTypeRepository.GetCompanyTypesAsync();
        }
        public async Task SendRegistrationEmailAsync( string email, string componeyid,string componeyName)
        {
            var payload = new RegistrationEmailPayload
            {
                CompanyEmail = email,
                CompanyId = componeyid,
                CompanyName = componeyName,
                Expiry = DateTime.UtcNow.AddHours(24)
            };

            var encryptedData = EncryptionHelper.Encrypt(payload);

            var urlEncoded = Uri.EscapeDataString(encryptedData);

            var registrationLink = _config["AppSettings:FrontendBaseUrl"]+$"/RegisterUser?token={urlEncoded}";

            var html = $@"
        <h3>Complete Your Registration</h3>
        <p>Please click the button below to complete company registration.</p>
        <a href='{registrationLink}'
           style='padding:10px 15px;background:#465fff;color:#fff;
           text-decoration:none;border-radius:5px'>
           Complete Registration
        </a>
        <p>This link expires in 24 hours.</p>
    ";

            await _emailService.SendAsync(
                email,
                "Complete Your Registration",
                html
            );
        }
    }
}
