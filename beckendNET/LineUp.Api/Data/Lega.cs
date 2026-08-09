namespace LineUp.Api.Data;

public class Lega
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string? Descrizione { get; set; }
    public string CodiceInvito { get; set; } = string.Empty;
}
