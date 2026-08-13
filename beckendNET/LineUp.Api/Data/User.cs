namespace LineUp.Api.Data;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string Cognome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime? EmailVerifiedAtUtc { get; set; }
    public Guid? LegaId { get; set; }
    public string Tema { get; set; } = "dark";
}
