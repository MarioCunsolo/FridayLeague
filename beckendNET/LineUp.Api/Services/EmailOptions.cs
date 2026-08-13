namespace LineUp.Api.Services;

public class EmailOptions
{
    public string Provider { get; set; } = "Development";
    public string? ResendApiKey { get; set; }
    public string FromAddress { get; set; } = "account@localhost";
    public string FromName { get; set; } = "LineUp";
    public string SmtpHost { get; set; } = "localhost";
    public int SmtpPort { get; set; } = 1025;
}

public class EmailVerificationOptions
{
    public int TokenLifetimeMinutes { get; set; } = 1440;
    public int ResendCooldownSeconds { get; set; } = 60;
    public int MaxSendsPerHour { get; set; } = 5;
}
