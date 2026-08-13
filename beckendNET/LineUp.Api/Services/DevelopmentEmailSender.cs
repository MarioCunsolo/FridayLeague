using Microsoft.Extensions.Logging;

namespace LineUp.Api.Services;

public class DevelopmentEmailSender(ILogger<DevelopmentEmailSender> logger) : IEmailSender
{
    public Task<string?> SendVerificationEmailAsync(
        string recipientEmail,
        string recipientName,
        string verificationUrl,
        string brandLogoUrl,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "[Development] Email di verifica per {RecipientEmail}. Apri questo link per attivare l'account: {VerificationUrl}",
            recipientEmail,
            verificationUrl);

        return Task.FromResult<string?>(null);
    }
}
