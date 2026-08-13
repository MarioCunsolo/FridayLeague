using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace LineUp.Api.Services;

/// <summary>
/// Invio SMTP senza autenticazione, pensato per l'ambiente locale con MailHog.
/// </summary>
public class SmtpEmailSender(IOptions<EmailOptions> emailOptions) : IEmailSender
{
    public async Task<string?> SendVerificationEmailAsync(
        string recipientEmail,
        string recipientName,
        string verificationUrl,
        string brandLogoUrl,
        CancellationToken cancellationToken = default)
    {
        var options = emailOptions.Value;
        using var message = new MailMessage
        {
            From = new MailAddress(options.FromAddress, options.FromName),
            Subject = "Attiva il tuo account LineUp",
            Body = EmailVerificationTemplate.CreateHtml(recipientName, verificationUrl, brandLogoUrl),
            IsBodyHtml = true
        };
        message.To.Add(recipientEmail);

        using var smtpClient = new SmtpClient(options.SmtpHost, options.SmtpPort)
        {
            EnableSsl = false,
            UseDefaultCredentials = false
        };
        await smtpClient.SendMailAsync(message, cancellationToken);
        return null;
    }
}
