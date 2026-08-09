namespace LineUp.Api.DTOs;

public class RimuoviPartecipanteRequest
{
    public Guid LegaId { get; set; }
    public Guid TargetUserId { get; set; }
}
