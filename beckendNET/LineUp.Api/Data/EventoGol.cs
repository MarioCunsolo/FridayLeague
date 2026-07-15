namespace LineUp.Api.Data;

public class EventoGol
{
    public int Id { get; set; }

    public int PartitaId { get; set; }
    public Partita Partita { get; set; } = null!;

    public int MarcatoreUserId { get; set; }
    public User Marcatore { get; set; } = null!;

    public bool InCasa { get; set; }

    public int? AssistUserId { get; set; }
    public User? Assist { get; set; }
}
