namespace LineUp.Api.Data;

public class PartecipantePartita
{
    public int Id { get; set; }

    public int PartitaId { get; set; }
    public Partita Partita { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public bool InCasa { get; set; }
    public bool Motm { get; set; }
}
