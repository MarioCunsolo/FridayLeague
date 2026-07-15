namespace LineUp.Api.Data;

public class Prenotazione
{
    public int Id { get; set; }

    public int PartitaId { get; set; }
    public Partita Partita { get; set; } = null!;

    // Valorizzato solo se il nome corrisponde a un membro registrato della lega
    public int? UserId { get; set; }
    public User? User { get; set; }

    public int PrenotatoDaUserId { get; set; }
    public User PrenotatoDa { get; set; } = null!;

    public string NomeCognome { get; set; } = string.Empty;
    public DateTime DataOra { get; set; }
}
