using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using LineUp.Api.Data;
using LineUp.Api.Services;

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

// Register Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthorizationHelper, AuthorizationHelper>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .WithOrigins("http://localhost:4200") // Angular default port
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:TokenKey"]!)),
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
    dbContext.Database.EnsureCreated();

    try
    {
        // Fail-safe: assicura che la tabella ActivityLogs esista nel database esistente
        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS ActivityLogs (
                Id INT AUTO_INCREMENT PRIMARY KEY,
                LegaId INT NOT NULL,
                EsecutoreId INT NOT NULL,
                EsecutoreNome VARCHAR(255) NOT NULL,
                EsecutoreRuolo VARCHAR(50) NOT NULL,
                Azione VARCHAR(50) NOT NULL,
                TargetUserId INT NULL,
                TargetUserNome VARCHAR(255) NOT NULL,
                Dettagli TEXT NOT NULL,
                Timestamp DATETIME NOT NULL,
                CONSTRAINT FK_ActivityLogs_Leghe_LegaId FOREIGN KEY (LegaId) REFERENCES Leghe(Id) ON DELETE CASCADE
            );
        ");

        // Fail-safe: assicura che il ruolo SUPER_ADMIN (4) sia presente in tabella Ruoli
        var hasSuperAdmin = dbContext.Ruoli.Any(r => r.Id == 4);
        if (!hasSuperAdmin)
        {
            dbContext.Database.ExecuteSqlRaw("INSERT INTO Ruoli (Id, Nome) VALUES (4, 'SUPER_ADMIN') ON DUPLICATE KEY UPDATE Nome='SUPER_ADMIN';");
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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Keep minimal API endpoints for backward compatibility / testing
app.MapGet("/api/teams", async (LineUpDbContext db) =>
    await db.Teams.Include(t => t.Players).ToListAsync())
    .WithName("GetTeams")
    .WithOpenApi();

app.MapGet("/api/players", async (LineUpDbContext db) =>
    await db.Players.Include(p => p.Team).ToListAsync())
    .WithName("GetPlayers")
    .WithOpenApi();

app.Run();
