namespace LineUp.Api.DTOs;

public class CambiaRuoloPartecipanteRequest
{
    public int LegaId { get; set; }
    public int TargetUserId { get; set; }
    public string NuovoRuolo { get; set; } = string.Empty;
}
