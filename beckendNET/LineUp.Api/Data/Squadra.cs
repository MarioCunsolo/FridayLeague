namespace LineUp.Api.Data;

public class Squadra
{
    public int Id { get; set; }
    public Guid LegaId { get; set; }
    public Lega Lega { get; set; } = null!;
    public string Nome { get; set; } = string.Empty;
}
