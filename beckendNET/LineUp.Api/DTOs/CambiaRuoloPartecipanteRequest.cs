namespace LineUp.Api.DTOs;

public class CambiaRuoloPartecipanteRequest
{
    public Guid LegaId { get; set; }
    public Guid TargetUserId { get; set; }
    public string NuovoRuolo { get; set; } = string.Empty;
}
