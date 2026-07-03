using Microsoft.EntityFrameworkCore;

namespace FridayLeague.Api.Data;

public class FridayLeagueDbContext : DbContext
{
    public FridayLeagueDbContext(DbContextOptions<FridayLeagueDbContext> options)
        : base(options)
    {
    }

    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Player> Players => Set<Player>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Lega> Leghe => Set<Lega>();
    public DbSet<UserLega> UserLeghe => Set<UserLega>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Unique index for User Email
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        // Composite key for UserLega
        modelBuilder.Entity<UserLega>()
            .HasKey(ul => new { ul.UserId, ul.LegaId });

        // Unique index for invite code
        modelBuilder.Entity<Lega>()
            .HasIndex(l => l.CodiceInvito)
            .IsUnique();

        // Seed data
        modelBuilder.Entity<Team>().HasData(
            new Team { Id = 1, Name = "Stella Rossa", FoundedYear = 2020 },
            new Team { Id = 2, Name = "Real Madrink", FoundedYear = 2021 },
            new Team { Id = 3, Name = "Atletico Ma Non Troppo", FoundedYear = 2022 }
        );

        modelBuilder.Entity<Player>().HasData(
            new Player { Id = 1, Name = "Mario Rossi", Role = "Attaccante", TeamId = 1 },
            new Player { Id = 2, Name = "Luigi Verdi", Role = "Portiere", TeamId = 1 },
            new Player { Id = 3, Name = "Giovanni Bianchi", Role = "Difensore", TeamId = 2 },
            new Player { Id = 4, Name = "Alessandro Neri", Role = "Centrocampista", TeamId = 3 }
        );
    }
}
