namespace LineUp.Api.Data;

public static class StatoPartita
{
    public const int ProgrammataId = 1;
    public const int InCorsoId = 2;
    public const int ConclusaId = 3;
    public const int AnnullataId = 4;

    public const string Programmata = "Programmata";
    public const string InCorso = "In Corso";
    public const string Conclusa = "Conclusa";
    public const string Annullata = "Annullata";
}

public class Partita
{
    public int Id { get; set; }
    public Guid LegaId { get; set; }
    public Lega Lega { get; set; } = null!;

    public int SquadraCasaId { get; set; }
    public Squadra SquadraCasa { get; set; } = null!;

    public int SquadraTrasfertaId { get; set; }
    public Squadra SquadraTrasferta { get; set; } = null!;

    public DateTime DataOra { get; set; }

    public int StatoId { get; set; } = StatoPartita.ProgrammataId;
    public StatoPartitaLookup Stato { get; set; } = null!;

    public int GolCasa { get; set; }
    public int GolTrasferta { get; set; }
    public string Stagione { get; set; } = string.Empty;

    public ICollection<PartecipantePartita> Partecipanti { get; set; } = new List<PartecipantePartita>();
    public ICollection<EventoGol> Gol { get; set; } = new List<EventoGol>();
}
