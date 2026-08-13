using LineUp.Api.Data;

namespace LineUp.Api.Services;

public interface IEmailVerificationService
{
    Task SendVerificationEmailAsync(User user, bool enforceLimits, CancellationToken cancellationToken = default);
    Task<bool> VerifyAsync(string rawToken, CancellationToken cancellationToken = default);
}
