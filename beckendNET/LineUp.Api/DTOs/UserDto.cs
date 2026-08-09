namespace LineUp.Api.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Cognome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Guid? LegaId { get; set; }
    public string Tema { get; set; } = "dark";
    public List<LegaDto> Leghe { get; set; } = new();
}

public class LegaDto
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Ruolo { get; set; } = string.Empty;
    public string CodiceInvito { get; set; } = string.Empty;
    public string? Descrizione { get; set; }
}
