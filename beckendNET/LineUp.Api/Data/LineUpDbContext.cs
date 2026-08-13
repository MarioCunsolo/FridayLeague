using Microsoft.EntityFrameworkCore;

namespace LineUp.Api.Data;

public class LineUpDbContext : DbContext
{
    public LineUpDbContext(DbContextOptions<LineUpDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Lega> Leghe => Set<Lega>();
    public DbSet<TipoLegaLookup> TipiLega => Set<TipoLegaLookup>();
    public DbSet<UserLega> UserLeghe => Set<UserLega>();
    public DbSet<RuoloLega> Ruoli => Set<RuoloLega>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<Squadra> Squadre => Set<Squadra>();
    public DbSet<StatoPartitaLookup> StatiPartita => Set<StatoPartitaLookup>();
    public DbSet<Partita> Partite => Set<Partita>();
    public DbSet<PartecipantePartita> PartecipantiPartita => Set<PartecipantePartita>();
    public DbSet<EventoGol> EventiGol => Set<EventoGol>();
    public DbSet<Prenotazione> Prenotazioni => Set<Prenotazione>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Unique index for User Email
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        // Composite key for UserLega
        modelBuilder.Entity<UserLega>()
            .HasKey(ul => new { ul.UserId, ul.LegaId });

        // Relationship between UserLega and RuoloLega
        modelBuilder.Entity<UserLega>()
            .HasOne(ul => ul.Ruolo)
            .WithMany()
            .HasForeignKey(ul => ul.RuoloId);

        // Relationship between UserLega and User
        modelBuilder.Entity<UserLega>()
            .HasOne(ul => ul.User)
            .WithMany()
            .HasForeignKey(ul => ul.UserId);

        // Unique index for invite code
        modelBuilder.Entity<Lega>()
            .HasIndex(l => l.CodiceInvito)
            .IsUnique();

        // Ogni lega deve essere identificabile da un nome univoco.
        modelBuilder.Entity<Lega>()
            .Property(l => l.Nome)
            .HasMaxLength(255);

        modelBuilder.Entity<Lega>()
            .HasIndex(l => l.Nome)
            .IsUnique();

        // Relazione Lega -> TipoLegaLookup
        modelBuilder.Entity<Lega>()
            .HasOne(l => l.TipoLega)
            .WithMany()
            .HasForeignKey(l => l.TipoLegaId)
            .OnDelete(DeleteBehavior.Restrict);

        // Un utente compare al più una volta come partecipante in una partita
        modelBuilder.Entity<PartecipantePartita>()
            .HasIndex(pp => new { pp.PartitaId, pp.UserId })
            .IsUnique();

        // Evita cascade path multipli su Partita -> Squadra (SquadraCasa/SquadraTrasferta)
        modelBuilder.Entity<Partita>()
            .HasOne(p => p.SquadraCasa)
            .WithMany()
            .HasForeignKey(p => p.SquadraCasaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Partita>()
            .HasOne(p => p.SquadraTrasferta)
            .WithMany()
            .HasForeignKey(p => p.SquadraTrasfertaId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relazione Partita -> StatoPartitaLookup
        modelBuilder.Entity<Partita>()
            .HasOne(p => p.Stato)
            .WithMany()
            .HasForeignKey(p => p.StatoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Evita cascade path multipli su EventoGol -> User (Marcatore/Assist)
        modelBuilder.Entity<EventoGol>()
            .HasOne(g => g.Marcatore)
            .WithMany()
            .HasForeignKey(g => g.MarcatoreUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<EventoGol>()
            .HasOne(g => g.Assist)
            .WithMany()
            .HasForeignKey(g => g.AssistUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Evita cascade path multipli su Prenotazione -> User (Utente prenotato/Prenotato da)
        modelBuilder.Entity<Prenotazione>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Prenotazione>()
            .HasOne(r => r.PrenotatoDa)
            .WithMany()
            .HasForeignKey(r => r.PrenotatoDaUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Seed roles data
        modelBuilder.Entity<RuoloLega>().HasData(
            new RuoloLega { Id = 1, Nome = "ADMIN" },
            new RuoloLega { Id = 2, Nome = "CO_ADMIN" },
            new RuoloLega { Id = 3, Nome = "GIOCATORE" },
            new RuoloLega { Id = 4, Nome = "SUPER_ADMIN" }
        );

        // Seed match status lookup data
        modelBuilder.Entity<StatoPartitaLookup>().HasData(
            new StatoPartitaLookup { Id = 1, Codice = "PROGRAMMATA", Nome = "Programmata" },
            new StatoPartitaLookup { Id = 2, Codice = "IN_CORSO", Nome = "In Corso" },
            new StatoPartitaLookup { Id = 3, Codice = "CONCLUSA", Nome = "Conclusa" },
            new StatoPartitaLookup { Id = 4, Codice = "ANNULLATA", Nome = "Annullata" }
        );

        // Seed tipo lega lookup data
        modelBuilder.Entity<TipoLegaLookup>().HasData(
            new TipoLegaLookup { Id = 1, Codice = "PARTITA_SINGOLA", Nome = "Partita Singola", Descrizione = "Lega classica in cui i giocatori prenotano singolarmente il posto per ogni match a due squadre." },
            new TipoLegaLookup { Id = 2, Codice = "CAMPIONATO", Nome = "Campionato", Descrizione = "Campionato a girone unico con numero di squadre definito. Tutte le squadre si affrontano in scontri diretti e vince chi accumula più punti." },
            new TipoLegaLookup { Id = 3, Codice = "TORNEO", Nome = "Torneo", Descrizione = "Torneo a gironi con numero di gironi definito. Le squadre competono prima nei gironi e poi avanzano alla fase ad eliminazione diretta fino alla finale." }
        );
    }
}
