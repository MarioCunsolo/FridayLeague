namespace LineUp.Api.Data;

public class UserLega
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid LegaId { get; set; }
    public Lega Lega { get; set; } = null!;

    public int RuoloId { get; set; }
    public RuoloLega Ruolo { get; set; } = null!;
}
