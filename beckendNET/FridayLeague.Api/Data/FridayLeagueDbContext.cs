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
    public DbSet<RuoloLega> Ruoli => Set<RuoloLega>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

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

        // Seed roles data
        modelBuilder.Entity<RuoloLega>().HasData(
            new RuoloLega { Id = 1, Nome = "ADMIN" },
            new RuoloLega { Id = 2, Nome = "CO_ADMIN" },
            new RuoloLega { Id = 3, Nome = "GIOCATORE" },
            new RuoloLega { Id = 4, Nome = "SUPER_ADMIN" }
        );
    }
}
