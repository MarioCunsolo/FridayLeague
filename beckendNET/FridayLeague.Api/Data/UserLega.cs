namespace FridayLeague.Api.Data;

public class UserLega
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int LegaId { get; set; }
    public Lega Lega { get; set; } = null!;

    public string Ruolo { get; set; } = string.Empty; // "AMMINISTRATORE" or "GIOCATORE"
}
