using System.Security.Cryptography;
using System.Text;
using LineUp.Api.Data;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LineUp.Api.Services;

public class EmailVerificationService(
    LineUpDbContext context,
    IEmailSender emailSender,
    IOptions<EmailVerificationOptions> verificationOptions,
    IConfiguration configuration,
    ILogger<EmailVerificationService> logger) : IEmailVerificationService
{
    public async Task SendVerificationEmailAsync(User user, bool enforceLimits, CancellationToken cancellationToken = default)
    {
        if (user.EmailVerifiedAtUtc.HasValue)
        {
            return;
        }

        var options = verificationOptions.Value;
        var now = DateTime.UtcNow;
        if (enforceLimits)
        {
            var hasRecentToken = await context.EmailVerificationTokens.AnyAsync(token =>
                token.UserId == user.Id && token.CreatedAtUtc >= now.AddSeconds(-options.ResendCooldownSeconds), cancellationToken);
            var sentInLastHour = await context.EmailVerificationTokens.CountAsync(token =>
                token.UserId == user.Id && token.CreatedAtUtc >= now.AddHours(-1), cancellationToken);

            if (hasRecentToken || sentInLastHour >= options.MaxSendsPerHour)
            {
                logger.LogWarning("Reinvio verifica email limitato per utente {UserId}", user.Id);
                return;
            }
        }

        var rawToken = await GenerateUniqueTokenAsync(cancellationToken);
        var token = new EmailVerificationToken
        {
            UserId = user.Id,
            TokenHash = HashToken(rawToken),
            CreatedAtUtc = now,
            ExpiresAtUtc = now.AddMinutes(options.TokenLifetimeMinutes)
        };

        await context.EmailVerificationTokens
            .Where(existing => existing.UserId == user.Id && existing.UsedAtUtc == null && existing.RevokedAtUtc == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(existing => existing.RevokedAtUtc, now), cancellationToken);
        context.EmailVerificationTokens.Add(token);
        await context.SaveChangesAsync(cancellationToken);

        try
        {
            var providerMessageId = await emailSender.SendVerificationEmailAsync(
                user.Email,
                user.Nome,
                BuildVerificationUrl(rawToken),
                BuildBrandLogoUrl(),
                cancellationToken);
            token.ProviderMessageId = providerMessageId;
            await context.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Email di verifica inviata per utente {UserId}", user.Id);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Invio email di verifica non riuscito per utente {UserId}", user.Id);
        }
    }

    public async Task<bool> VerifyAsync(string rawToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return false;
        }

        var tokenHash = HashToken(rawToken);
        var token = await context.EmailVerificationTokens
            .Include(item => item.User)
            .SingleOrDefaultAsync(item => item.TokenHash == tokenHash, cancellationToken);
        if (token == null)
        {
            return false;
        }

        if (token.User.EmailVerifiedAtUtc.HasValue)
        {
            return true;
        }

        var now = DateTime.UtcNow;
        if (token.UsedAtUtc.HasValue || token.RevokedAtUtc.HasValue || token.ExpiresAtUtc <= now)
        {
            return false;
        }

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        token.User.EmailVerifiedAtUtc = now;
        token.UsedAtUtc = now;
        await context.SaveChangesAsync(cancellationToken);
        await context.EmailVerificationTokens
            .Where(item => item.UserId == token.UserId && item.Id != token.Id && item.UsedAtUtc == null && item.RevokedAtUtc == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.RevokedAtUtc, now), cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        logger.LogInformation("Email verificata per utente {UserId}", token.UserId);
        return true;
    }

    private async Task<string> GenerateUniqueTokenAsync(CancellationToken cancellationToken)
    {
        while (true)
        {
            var token = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
            var hash = HashToken(token);
            if (!await context.EmailVerificationTokens.AnyAsync(item => item.TokenHash == hash, cancellationToken))
            {
                return token;
            }
        }
    }

    private string BuildVerificationUrl(string rawToken)
    {
        var frontendBaseUrl = GetFrontendBaseUrl();
        return $"{frontendBaseUrl}/verifica-email#token={rawToken}";
    }

    private string BuildBrandLogoUrl() => $"{GetFrontendBaseUrl()}/assets/logo-icon.png";

    private string GetFrontendBaseUrl()
    {
        var frontendBaseUrl = configuration["App:FrontendBaseUrl"]?.TrimEnd('/');
        if (!Uri.TryCreate(frontendBaseUrl, UriKind.Absolute, out _))
        {
            throw new InvalidOperationException("App:FrontendBaseUrl non è configurato correttamente.");
        }

        return frontendBaseUrl;
    }

    private static string HashToken(string rawToken) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
}
