namespace Marketplace.Api.Services.EmailService
{
    public interface IEmailService
    {
        Task SendAsync(string to, string subject, string htmlBody);
    }
}
