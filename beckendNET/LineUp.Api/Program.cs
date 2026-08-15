using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using LineUp.Api.Data;
using LineUp.Api.Services;
using LineUp.Api.Proxies;
using LineUp.Api.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure MySQL DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var serverVersion = new MySqlServerVersion(new Version(8, 0, 30));
builder.Services.AddDbContext<LineUpDbContext>(options =>
    options.UseMySql(connectionString, serverVersion));

var jwtTokenKey = builder.Configuration["JwtSettings:TokenKey"];
const int jwtMinimumKeySizeBytes = 64;
if (string.IsNullOrWhiteSpace(jwtTokenKey))
{
    throw new InvalidOperationException("JwtSettings:TokenKey deve essere configurata tramite variabile d'ambiente.");
}

if (Encoding.UTF8.GetByteCount(jwtTokenKey) < jwtMinimumKeySizeBytes)
{
    throw new InvalidOperationException($"JwtSettings:TokenKey deve avere almeno {jwtMinimumKeySizeBytes} byte per HMAC-SHA512.");
}

var allowedCorsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
if (!builder.Environment.IsDevelopment() && allowedCorsOrigins.Length == 0)
{
    throw new InvalidOperationException("In produzione deve essere configurata almeno un'origine CORS tramite Cors__AllowedOrigins__0.");
}

var frontendBaseUrl = builder.Configuration["App:FrontendBaseUrl"];
if (!Uri.TryCreate(frontendBaseUrl, UriKind.Absolute, out var parsedFrontendBaseUrl) ||
    (!builder.Environment.IsDevelopment() && parsedFrontendBaseUrl.Scheme != Uri.UriSchemeHttps))
{
    throw new InvalidOperationException("App:FrontendBaseUrl deve essere un URL assoluto e HTTPS in produzione.");
}

var emailOptions = builder.Configuration.GetSection("Email").Get<EmailOptions>() ?? new EmailOptions();
if (!builder.Environment.IsDevelopment() && !string.Equals(emailOptions.Provider, "Resend", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException("In produzione Email:Provider deve essere Resend.");
}

if (string.Equals(emailOptions.Provider, "Resend", StringComparison.OrdinalIgnoreCase) &&
    (string.IsNullOrWhiteSpace(emailOptions.ResendApiKey) || string.IsNullOrWhiteSpace(emailOptions.FromAddress)))
{
    throw new InvalidOperationException("Email:ResendApiKey e Email:FromAddress sono obbligatorie quando il provider è Resend.");
}

builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection("Email"));
builder.Services.Configure<EmailVerificationOptions>(builder.Configuration.GetSection("EmailVerification"));
builder.Services.AddHttpClient<ResendEmailSender>(client => client.BaseAddress = new Uri("https://api.resend.com/"));
builder.Services.AddScoped<DevelopmentEmailSender>();
builder.Services.AddScoped<SmtpEmailSender>();
builder.Services.AddScoped<IEmailSender>(serviceProvider =>
    string.Equals(emailOptions.Provider, "Resend", StringComparison.OrdinalIgnoreCase)
        ? serviceProvider.GetRequiredService<ResendEmailSender>()
        : string.Equals(emailOptions.Provider, "MailHog", StringComparison.OrdinalIgnoreCase)
            ? serviceProvider.GetRequiredService<SmtpEmailSender>()
        : serviceProvider.GetRequiredService<DevelopmentEmailSender>());
builder.Services.AddScoped<IEmailVerificationService, EmailVerificationService>();

builder.Services.AddRateLimiter(rateLimitOptions =>
{
    rateLimitOptions.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    rateLimitOptions.AddFixedWindowLimiter("email-verification", limiterOptions =>
    {
        limiterOptions.PermitLimit = 12;
        limiterOptions.Window = TimeSpan.FromMinutes(15);
        limiterOptions.QueueLimit = 0;
        limiterOptions.AutoReplenishment = true;
    });
});

// Register Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthorizationHelper, AuthorizationHelper>();

// Repository Pattern: Controller -> Service -> Proxy -> Repository (vedi ARCHITECTURE.md)
builder.Services.AddScoped<ISquadraRepository, SquadraRepository>();
builder.Services.AddScoped<IPartitaRepository, PartitaRepository>();
builder.Services.AddScoped<IPartecipantePartitaRepository, PartecipantePartitaRepository>();
builder.Services.AddScoped<IEventoGolRepository, EventoGolRepository>();
builder.Services.AddScoped<IPrenotazioneRepository, PrenotazioneRepository>();
builder.Services.AddScoped<IUserLegaRepository, UserLegaRepository>();

builder.Services.AddScoped<IMatchProxy, MatchProxy>();
builder.Services.AddScoped<IPlayerProxy, PlayerProxy>();
builder.Services.AddScoped<IStatsProxy, StatsProxy>();
builder.Services.AddScoped<IReservationProxy, ReservationProxy>();

builder.Services.AddScoped<IMatchService, MatchService>();
builder.Services.AddScoped<IPlayerService, PlayerService>();
builder.Services.AddScoped<IStatsService, StatsService>();
builder.Services.AddScoped<IReservationService, ReservationService>();

// In sviluppo sono consentite le origini locali (inclusi i test da dispositivi mobili).
// In produzione l'elenco deve essere definito esplicitamente nelle variabili d'ambiente.
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(_ => true);
        }
        else
        {
            policy.WithOrigins(allowedCorsOrigins);
        }

        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtTokenKey)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

var app = builder.Build();

// Automatically create database and seed data at startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<LineUpDbContext>();
    try
    {
        // Inizializza il database tramite EF Core
        dbContext.Database.EnsureCreated();

        // Fail-safe: assicura che la tabella TipiLega esista e sia popolata
        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS TipiLega (
                Id INT PRIMARY KEY,
                Codice VARCHAR(50) NOT NULL,
                Nome VARCHAR(100) NOT NULL,
                Descrizione TEXT NULL
            );
        ");

        dbContext.Database.ExecuteSqlRaw(@"
            INSERT IGNORE INTO TipiLega (Id, Codice, Nome, Descrizione) VALUES
            (1, 'PARTITA_SINGOLA', 'Partita Singola', 'Lega classica in cui i giocatori prenotano singolarmente il posto per ogni match a due squadre.'),
            (2, 'CAMPIONATO', 'Campionato', 'Campionato a girone unico con numero di squadre definito. Tutte le squadre si affrontano in scontri diretti e vince chi accumula più punti.'),
            (3, 'TORNEO', 'Torneo', 'Torneo a gironi con numero di gironi definito. Le squadre competono prima nei gironi e poi avanzano alla fase ad eliminazione diretta fino alla finale.');
        ");

        // Fail-safe: assicura che le tabelle core esistano
        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS Leghe (
                Id VARCHAR(36) PRIMARY KEY,
                Nome VARCHAR(255) NOT NULL UNIQUE,
                Descrizione TEXT NULL,
                CodiceInvito VARCHAR(50) NOT NULL UNIQUE,
                TipoLegaId INT NOT NULL DEFAULT 1,
                NumeroSquadre INT NULL,
                NumeroGironi INT NULL,
                DimensioneSquadra INT NULL,
                CONSTRAINT FK_Leghe_TipiLega_TipoLegaId FOREIGN KEY (TipoLegaId) REFERENCES TipiLega(Id)
            );
        ");

        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS Users (
                Id VARCHAR(36) PRIMARY KEY,
                Nome VARCHAR(255) NOT NULL,
                Cognome VARCHAR(255) NOT NULL,
                Email VARCHAR(255) NOT NULL UNIQUE,
                PasswordHash VARCHAR(255) NOT NULL,
                EmailVerifiedAtUtc DATETIME(6) NULL,
                LegaId VARCHAR(36) NULL,
                Tema VARCHAR(20) NOT NULL DEFAULT 'dark'
            );
        ");

        var hasEmailVerifiedAtUtc = dbContext.Database.SqlQueryRaw<int>(
            "SELECT COUNT(*) AS Value FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'EmailVerifiedAtUtc'"
        ).AsEnumerable().FirstOrDefault() > 0;

        if (!hasEmailVerifiedAtUtc)
        {
            dbContext.Database.ExecuteSqlRaw("ALTER TABLE Users ADD COLUMN EmailVerifiedAtUtc DATETIME(6) NULL;");
            dbContext.Database.ExecuteSqlRaw("UPDATE Users SET EmailVerifiedAtUtc = UTC_TIMESTAMP(6) WHERE EmailVerifiedAtUtc IS NULL;");
        }

        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS EmailVerificationTokens (
                Id BIGINT AUTO_INCREMENT PRIMARY KEY,
                UserId VARCHAR(36) NOT NULL,
                TokenHash CHAR(64) NOT NULL,
                CreatedAtUtc DATETIME(6) NOT NULL,
                ExpiresAtUtc DATETIME(6) NOT NULL,
                UsedAtUtc DATETIME(6) NULL,
                RevokedAtUtc DATETIME(6) NULL,
                ProviderMessageId VARCHAR(255) NULL,
                CONSTRAINT UQ_EmailVerificationTokens_TokenHash UNIQUE (TokenHash),
                INDEX IX_EmailVerificationTokens_UserId_CreatedAtUtc (UserId, CreatedAtUtc),
                INDEX IX_EmailVerificationTokens_ExpiresAtUtc (ExpiresAtUtc)
            );
        ");

        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS Ruoli (
                Id INT PRIMARY KEY,
                Nome VARCHAR(50) NOT NULL
            );
        ");

        dbContext.Database.ExecuteSqlRaw(@"
            INSERT IGNORE INTO Ruoli (Id, Nome) VALUES
            (1, 'ADMIN'),
            (2, 'CO_ADMIN'),
            (3, 'GIOCATORE'),
            (4, 'SUPER_ADMIN');
        ");

        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS UserLeghe (
                UserId VARCHAR(36) NOT NULL,
                LegaId VARCHAR(36) NOT NULL,
                RuoloId INT NOT NULL,
                PRIMARY KEY (UserId, LegaId),
                CONSTRAINT FK_UserLeghe_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
                CONSTRAINT FK_UserLeghe_Leghe_LegaId FOREIGN KEY (LegaId) REFERENCES Leghe(Id) ON DELETE CASCADE,
                CONSTRAINT FK_UserLeghe_Ruoli_RuoloId FOREIGN KEY (RuoloId) REFERENCES Ruoli(Id)
            );
        ");

        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS ActivityLogs (
                Id INT AUTO_INCREMENT PRIMARY KEY,
                LegaId VARCHAR(36) NOT NULL,
                EsecutoreId VARCHAR(36) NOT NULL,
                EsecutoreNome VARCHAR(255) NOT NULL,
                EsecutoreRuolo VARCHAR(50) NOT NULL,
                Azione VARCHAR(50) NOT NULL,
                TargetUserId VARCHAR(36) NULL,
                TargetUserNome VARCHAR(255) NOT NULL,
                Dettagli TEXT NOT NULL,
                Timestamp DATETIME NOT NULL,
                CONSTRAINT FK_ActivityLogs_Leghe_LegaId FOREIGN KEY (LegaId) REFERENCES Leghe(Id) ON DELETE CASCADE
            );
        ");

        // La rimozione delle tabelle legacy è consentita solo in sviluppo e deve essere esplicita.
        if (builder.Configuration.GetValue<bool>("Database:RemoveLegacyTables"))
        {
            dbContext.Database.ExecuteSqlRaw("DROP TABLE IF EXISTS Players;");
            dbContext.Database.ExecuteSqlRaw("DROP TABLE IF EXISTS Teams;");
        }

        // Fail-safe: assicura che la tabella TipiLega esista e sia popolata
        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS TipiLega (
                Id INT PRIMARY KEY,
                Codice VARCHAR(50) NOT NULL,
                Nome VARCHAR(100) NOT NULL,
                Descrizione TEXT NULL
            );
        ");

        dbContext.Database.ExecuteSqlRaw(@"
            INSERT IGNORE INTO TipiLega (Id, Codice, Nome, Descrizione) VALUES
            (1, 'PARTITA_SINGOLA', 'Partita Singola', 'Lega classica in cui i giocatori prenotano singolarmente il posto per ogni match a due squadre.'),
            (2, 'CAMPIONATO', 'Campionato', 'Campionato a girone unico con numero di squadre definito. Tutte le squadre si affrontano in scontri diretti e vince chi accumula più punti.'),
            (3, 'TORNEO', 'Torneo', 'Torneo a gironi con numero di gironi definito. Le squadre competono prima nei gironi e poi avanzano alla fase ad eliminazione diretta fino alla finale.');
        ");

        try
        {
            var hasTipoLegaId = dbContext.Database.SqlQueryRaw<int>(
                "SELECT COUNT(*) AS Value FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Leghe' AND COLUMN_NAME = 'TipoLegaId'"
            ).AsEnumerable().FirstOrDefault() > 0;

            if (!hasTipoLegaId)
            {
                dbContext.Database.ExecuteSqlRaw("ALTER TABLE Leghe ADD COLUMN TipoLegaId INT NOT NULL DEFAULT 1;");
            }

            var hasNumeroSquadre = dbContext.Database.SqlQueryRaw<int>(
                "SELECT COUNT(*) AS Value FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Leghe' AND COLUMN_NAME = 'NumeroSquadre'"
            ).AsEnumerable().FirstOrDefault() > 0;

            if (!hasNumeroSquadre)
            {
                dbContext.Database.ExecuteSqlRaw("ALTER TABLE Leghe ADD COLUMN NumeroSquadre INT NULL;");
            }

            var hasNumeroGironi = dbContext.Database.SqlQueryRaw<int>(
                "SELECT COUNT(*) AS Value FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Leghe' AND COLUMN_NAME = 'NumeroGironi'"
            ).AsEnumerable().FirstOrDefault() > 0;

            if (!hasNumeroGironi)
            {
                dbContext.Database.ExecuteSqlRaw("ALTER TABLE Leghe ADD COLUMN NumeroGironi INT NULL;");
            }

            var hasDimensioneSquadra = dbContext.Database.SqlQueryRaw<int>(
                "SELECT COUNT(*) AS Value FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Leghe' AND COLUMN_NAME = 'DimensioneSquadra'"
            ).AsEnumerable().FirstOrDefault() > 0;

            if (!hasDimensioneSquadra)
            {
                dbContext.Database.ExecuteSqlRaw("ALTER TABLE Leghe ADD COLUMN DimensioneSquadra INT NULL;");
            }

            var leagueNameColumnType = dbContext.Database.SqlQueryRaw<string>(
                "SELECT DATA_TYPE AS Value FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Leghe' AND COLUMN_NAME = 'Nome'"
            ).AsEnumerable().FirstOrDefault();

            if (leagueNameColumnType is "text" or "mediumtext" or "longtext")
            {
                dbContext.Database.ExecuteSqlRaw("ALTER TABLE Leghe MODIFY COLUMN Nome VARCHAR(255) NOT NULL;");
            }

            var hasUniqueLeagueNameIndex = dbContext.Database.SqlQueryRaw<int>(
                "SELECT COUNT(*) AS Value FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Leghe' AND COLUMN_NAME = 'Nome' AND NON_UNIQUE = 0"
            ).AsEnumerable().FirstOrDefault() > 0;

            if (!hasUniqueLeagueNameIndex)
            {
                dbContext.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IX_Leghe_Nome ON Leghe (Nome);");
            }
        }
        catch { }

        // Fail-safe: assicura che le tabelle del dominio Partite/Prenotazioni esistano nel database esistente
        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS Squadre (
                Id INT AUTO_INCREMENT PRIMARY KEY,
                LegaId VARCHAR(36) NOT NULL,
                Nome VARCHAR(255) NOT NULL,
                CONSTRAINT FK_Squadre_Leghe_LegaId FOREIGN KEY (LegaId) REFERENCES Leghe(Id) ON DELETE CASCADE
            );
        ");

        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS StatiPartita (
                Id INT PRIMARY KEY,
                Codice VARCHAR(50) NOT NULL,
                Nome VARCHAR(50) NOT NULL
            );
        ");

        dbContext.Database.ExecuteSqlRaw(@"
            INSERT IGNORE INTO StatiPartita (Id, Codice, Nome) VALUES
            (1, 'PROGRAMMATA', 'Programmata'),
            (2, 'IN_CORSO', 'In Corso'),
            (3, 'CONCLUSA', 'Conclusa'),
            (4, 'ANNULLATA', 'Annullata');
        ");

        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS Partite (
                Id INT AUTO_INCREMENT PRIMARY KEY,
                LegaId VARCHAR(36) NOT NULL,
                SquadraCasaId INT NOT NULL,
                SquadraTrasfertaId INT NOT NULL,
                DataOra DATETIME NOT NULL,
                StatoId INT NOT NULL DEFAULT 1,
                GolCasa INT NOT NULL DEFAULT 0,
                GolTrasferta INT NOT NULL DEFAULT 0,
                Stagione VARCHAR(10) NOT NULL,
                CONSTRAINT FK_Partite_Leghe_LegaId FOREIGN KEY (LegaId) REFERENCES Leghe(Id) ON DELETE CASCADE,
                CONSTRAINT FK_Partite_Squadre_SquadraCasaId FOREIGN KEY (SquadraCasaId) REFERENCES Squadre(Id),
                CONSTRAINT FK_Partite_Squadre_SquadraTrasfertaId FOREIGN KEY (SquadraTrasfertaId) REFERENCES Squadre(Id),
                CONSTRAINT FK_Partite_StatiPartita_StatoId FOREIGN KEY (StatoId) REFERENCES StatiPartita(Id)
            );
        ");

        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS PartecipantiPartita (
                Id INT AUTO_INCREMENT PRIMARY KEY,
                PartitaId INT NOT NULL,
                UserId VARCHAR(36) NOT NULL,
                InCasa TINYINT(1) NOT NULL,
                Motm TINYINT(1) NOT NULL DEFAULT 0,
                CONSTRAINT FK_PartecipantiPartita_Partite_PartitaId FOREIGN KEY (PartitaId) REFERENCES Partite(Id) ON DELETE CASCADE,
                CONSTRAINT FK_PartecipantiPartita_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id),
                CONSTRAINT UQ_PartecipantiPartita_Partita_User UNIQUE (PartitaId, UserId)
            );
        ");

        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS EventiGol (
                Id INT AUTO_INCREMENT PRIMARY KEY,
                PartitaId INT NOT NULL,
                MarcatoreUserId VARCHAR(36) NOT NULL,
                InCasa TINYINT(1) NOT NULL,
                AssistUserId VARCHAR(36) NULL,
                CONSTRAINT FK_EventiGol_Partite_PartitaId FOREIGN KEY (PartitaId) REFERENCES Partite(Id) ON DELETE CASCADE,
                CONSTRAINT FK_EventiGol_Users_MarcatoreUserId FOREIGN KEY (MarcatoreUserId) REFERENCES Users(Id),
                CONSTRAINT FK_EventiGol_Users_AssistUserId FOREIGN KEY (AssistUserId) REFERENCES Users(Id)
            );
        ");

        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS Prenotazioni (
                Id INT AUTO_INCREMENT PRIMARY KEY,
                PartitaId INT NOT NULL,
                UserId VARCHAR(36) NULL,
                PrenotatoDaUserId VARCHAR(36) NOT NULL,
                NomeCognome VARCHAR(255) NOT NULL,
                DataOra DATETIME NOT NULL,
                CONSTRAINT FK_Prenotazioni_Partite_PartitaId FOREIGN KEY (PartitaId) REFERENCES Partite(Id) ON DELETE CASCADE,
                CONSTRAINT FK_Prenotazioni_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id),
                CONSTRAINT FK_Prenotazioni_Users_PrenotatoDaUserId FOREIGN KEY (PrenotatoDaUserId) REFERENCES Users(Id)
            );
        ");

        // Fail-safe: assicura che il ruolo SUPER_ADMIN (4) sia presente in tabella Ruoli
        var hasSuperAdmin = dbContext.Ruoli.Any(r => r.Id == 4);
        if (!hasSuperAdmin)
        {
            dbContext.Database.ExecuteSqlRaw("INSERT INTO Ruoli (Id, Nome) VALUES (4, 'SUPER_ADMIN') ON DUPLICATE KEY UPDATE Nome='SUPER_ADMIN';");
        }

        if (builder.Configuration.GetValue<bool>("SeedDemoData"))
        {
            // Seed "Friday League" if it doesn't exist
            var league = dbContext.Leghe.FirstOrDefault(l => l.Nome == "Friday League");
            if (league == null)
            {
                league = new Lega
                {
                    Nome = "Friday League",
                    CodiceInvito = "FRIDAY123",
                    Descrizione = "Lega ufficiale del venerdì"
                };
                dbContext.Leghe.Add(league);
                dbContext.SaveChanges();
            }

            // Seed default users
            var seedUsers = new List<(string Email, string Nome, string Cognome, int RuoloId)>
            {
            ("s@v.com", "Salvo", "Vitale", 4),      // SUPER_ADMIN
            ("m@c.com", "Mario", "Cunsolo", 1),     // ADMIN
            ("p@db.com", "Player", "Db", 3),        // GIOCATORE
            ("g.rossi@friday.com", "Giuseppe", "Rossi", 3),
            ("l.bianchi@friday.com", "Luca", "Bianchi", 3),
            ("m.neri@friday.com", "Marco", "Neri", 3),
            ("a.gialli@friday.com", "Andrea", "Gialli", 3),
            ("r.verdi@friday.com", "Roberto", "Verdi", 3),
            ("f.nipotini@friday.com", "Franco", "Nipotini", 3),
            ("g.vanni@friday.com", "Giorgio", "Vanni", 3)
            };

            foreach (var u in seedUsers)
            {
            var user = dbContext.Users.FirstOrDefault(x => x.Email == u.Email);
            if (user == null)
            {
                user = new User
                {
                    Email = u.Email,
                    Nome = u.Nome,
                    Cognome = u.Cognome,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
                    EmailVerifiedAtUtc = DateTime.UtcNow,
                    LegaId = league.Id,
                    Tema = "dark"
                };
                dbContext.Users.Add(user);
                dbContext.SaveChanges();
            }
            else
            {
                if (user.LegaId == null)
                {
                    user.LegaId = league.Id;
                    dbContext.SaveChanges();
                }

                if (!user.EmailVerifiedAtUtc.HasValue)
                {
                    user.EmailVerifiedAtUtc = DateTime.UtcNow;
                    dbContext.SaveChanges();
                }
            }

            var userLega = dbContext.UserLeghe.FirstOrDefault(ul => ul.UserId == user.Id && ul.LegaId == league.Id);
            if (userLega == null)
            {
                userLega = new UserLega
                {
                    UserId = user.Id,
                    LegaId = league.Id,
                    RuoloId = u.RuoloId
                };
                dbContext.UserLeghe.Add(userLega);
                dbContext.SaveChanges();
            }
            else if (userLega.RuoloId != u.RuoloId)
            {
                userLega.RuoloId = u.RuoloId;
                dbContext.SaveChanges();
            }
            }

        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Errore durante la migrazione fail-safe: {ex.Message}");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("CorsPolicy");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();
app.MapControllers();

app.Run();
