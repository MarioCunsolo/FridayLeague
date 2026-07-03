namespace FridayLeague.Api.Data;

public class Lega
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descrizione { get; set; }
    public string CodiceInvito { get; set; } = string.Empty;
}
