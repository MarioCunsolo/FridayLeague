namespace LineUp.Api.Data;

public class EventoGol
{
    public int Id { get; set; }

    public int PartitaId { get; set; }
    public Partita Partita { get; set; } = null!;

    public Guid MarcatoreUserId { get; set; }
    public User Marcatore { get; set; } = null!;

    public bool InCasa { get; set; }

    public Guid? AssistUserId { get; set; }
    public User? Assist { get; set; }
}
