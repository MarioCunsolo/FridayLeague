using System.ComponentModel.DataAnnotations;

namespace LineUp.Api.DTOs;

public class VerifyEmailRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;
}

public class ResendVerificationRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class RegistrationPendingResponse
{
    public string Message { get; set; } = "Se l'indirizzo può essere registrato, riceverai un'email con le istruzioni per attivare l'account.";
}

public class VerifyEmailResponse
{
    public bool Verified { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ApiErrorResponse
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
