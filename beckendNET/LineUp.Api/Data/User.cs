namespace LineUp.Api.Data;

public class User
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Cognome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public int? LegaId { get; set; }
    public string Tema { get; set; } = "dark";
}
