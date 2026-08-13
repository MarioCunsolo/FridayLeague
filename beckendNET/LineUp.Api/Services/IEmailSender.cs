namespace LineUp.Api.Services;

public interface IEmailSender
{
    Task<string?> SendVerificationEmailAsync(
        string recipientEmail,
        string recipientName,
        string verificationUrl,
        string brandLogoUrl,
        CancellationToken cancellationToken = default);
}
