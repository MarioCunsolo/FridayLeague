namespace LineUp.Api.Data;

public class TipoLegaLookup
{
    public int Id { get; set; }
    public string Codice { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string? Descrizione { get; set; }
}
