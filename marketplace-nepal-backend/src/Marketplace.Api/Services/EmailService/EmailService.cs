using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using System.Net;
using System.Net.Mail;
using SmtpClient = MailKit.Net.Smtp.SmtpClient;
namespace Marketplace.Api.Services.EmailService
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendAsync(string to, string subject, string htmlBody)
        {
            var host = _config["SmtpSettings:Host"];
            var port = int.Parse(_config["SmtpSettings:Port"] ?? "465");
            var username = _config["SmtpSettings:Username"];
            var password = _config["SmtpSettings:Password"];
            var fromEmail = _config["SmtpSettings:FromEmail"];
            var fromName = _config["SmtpSettings:FromName"];

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = htmlBody };

            using var client = new SmtpClient();

            // Accept self-signed certificates
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;

            // 🔑 Use correct port & SSL option
            SecureSocketOptions options = port switch
            {
                465 => SecureSocketOptions.SslOnConnect,
                587 => SecureSocketOptions.StartTls,
                _ => SecureSocketOptions.Auto
            };

            await client.ConnectAsync(host, port, options);

            // Login
            await client.AuthenticateAsync(username, password);

            // Send email
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }

    }
}
