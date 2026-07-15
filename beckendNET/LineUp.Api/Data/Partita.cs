namespace LineUp.Api.Data;

public static class StatoPartita
{
    public const string Programmata = "Programmata";
    public const string InCorso = "In Corso";
    public const string Terminata = "Terminata";
}

public class Partita
{
    public int Id { get; set; }
    public int LegaId { get; set; }
    public Lega Lega { get; set; } = null!;

    public int SquadraCasaId { get; set; }
    public Squadra SquadraCasa { get; set; } = null!;

    public int SquadraTrasfertaId { get; set; }
    public Squadra SquadraTrasferta { get; set; } = null!;

    public DateTime DataOra { get; set; }
    public string Stato { get; set; } = StatoPartita.Programmata;
    public int GolCasa { get; set; }
    public int GolTrasferta { get; set; }
    public string Stagione { get; set; } = string.Empty;

    public ICollection<PartecipantePartita> Partecipanti { get; set; } = new List<PartecipantePartita>();
    public ICollection<EventoGol> Gol { get; set; } = new List<EventoGol>();
}
