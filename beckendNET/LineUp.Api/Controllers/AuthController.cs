using System.Security.Claims;
using LineUp.Api.Data;
using LineUp.Api.DTOs;
using LineUp.Api.Services;
using LineUp.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace LineUp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly LineUpDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IEmailVerificationService _emailVerificationService;

    public AuthController(
        LineUpDbContext context,
        ITokenService tokenService,
        IEmailVerificationService emailVerificationService)
    {
        _context = context;
        _tokenService = tokenService;
        _emailVerificationService = emailVerificationService;
    }

    [HttpPost("register")]
    [EnableRateLimiting("email-verification")]
    public async Task<ActionResult<RegistrationPendingResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var response = new RegistrationPendingResponse();
        if (await UserExists(normalizedEmail))
        {
            return Accepted(response);
        }

        var user = new User
        {
            Nome = request.Nome.Trim(),
            Cognome = request.Cognome.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        _context.Users.Add(user);
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Accepted(response);
        }

        await _emailVerificationService.SendVerificationEmailAsync(user, enforceLimits: false, cancellationToken);
        return Accepted(response);
    }

    [HttpPost("verify-email")]
    [EnableRateLimiting("email-verification")]
    public async Task<ActionResult<VerifyEmailResponse>> VerifyEmail(VerifyEmailRequest request, CancellationToken cancellationToken)
    {
        var verified = await _emailVerificationService.VerifyAsync(request.Token, cancellationToken);
        if (!verified)
        {
            return BadRequest(new ApiErrorResponse
            {
                Code = "INVALID_OR_EXPIRED_TOKEN",
                Message = "Il link di attivazione non è valido o è scaduto. Richiedi una nuova email di verifica."
            });
        }

        return Ok(new VerifyEmailResponse
        {
            Verified = true,
            Message = "Il tuo indirizzo email è stato verificato. Ora puoi accedere a LineUp."
        });
    }

    [HttpPost("resend-verification")]
    [EnableRateLimiting("email-verification")]
    public async Task<ActionResult<RegistrationPendingResponse>> ResendVerification(ResendVerificationRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.SingleOrDefaultAsync(item => item.Email == normalizedEmail, cancellationToken);
        if (user != null && !user.EmailVerifiedAtUtc.HasValue)
        {
            await _emailVerificationService.SendVerificationEmailAsync(user, enforceLimits: true, cancellationToken);
        }

        return Accepted(new RegistrationPendingResponse
        {
            Message = "Se esiste un account non ancora attivato, riceverai una nuova email di verifica."
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await _context.Users
            .SingleOrDefaultAsync(x => x.Email == request.Email.Trim().ToLowerInvariant());

        if (user == null)
        {
            return Unauthorized("Credenziali non valide.");
        }

        var result = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!result)
        {
            return Unauthorized("Credenziali non valide.");
        }

        if (!user.EmailVerifiedAtUtc.HasValue)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ApiErrorResponse
            {
                Code = "EMAIL_NOT_VERIFIED",
                Message = "Devi verificare l'indirizzo email prima di accedere."
            });
        }

        var userDto = await MapToUserDtoWithLegheAsync(user);
        var token = _tokenService.CreateToken(user);

        return Ok(new AuthResponse
        {
            User = userDto,
            Token = token
        });
    }

    [Authorize]
    [HttpGet("current-user")]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = User.GetUserId();
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
        {
            return NotFound("Utente non trovato.");
        }

        if (!user.EmailVerifiedAtUtc.HasValue)
        {
            return Unauthorized();
        }

        return Ok(await MapToUserDtoWithLegheAsync(user));
    }

    [Authorize]
    [HttpPost("aggiorna-profilo")]
    public async Task<ActionResult<UserDto>> AggiornaProfilo(AggiornaProfiloRequest request)
    {
        var userId = User.GetUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("Utente non trovato.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (user.Email.ToLower() != normalizedEmail)
        {
            return BadRequest("La modifica dell'indirizzo email richiede una nuova verifica e non è ancora disponibile.");
        }

        user.Nome = request.Nome.Trim();
        user.Cognome = request.Cognome.Trim();

        await _context.SaveChangesAsync();

        return Ok(await MapToUserDtoWithLegheAsync(user));
    }

    [Authorize]
    [HttpPost("cambia-password")]
    public async Task<IActionResult> CambiaPassword(CambiaPasswordRequest request)
    {
        var userId = User.GetUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("Utente non trovato.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Password modificata con successo!" });
    }

    [Authorize]
    [HttpPost("crea-lega")]
    public async Task<ActionResult<UserDto>> CreaLega(CreaLegaRequest request)
    {
        var userId = User.GetUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("Utente non trovato.");

        var leagueName = request.NomeLega.Trim();
        if (string.IsNullOrWhiteSpace(leagueName))
        {
            return BadRequest("Il nome della lega è obbligatorio.");
        }

        var leagueNameExists = await _context.Leghe
            .AnyAsync(lega => lega.Nome.ToLower() == leagueName.ToLower());
        if (leagueNameExists)
        {
            return BadRequest("Esiste già una lega con questo nome.");
        }

        // Validazione Tipo Lega
        var tipoLegaExists = await _context.TipiLega.AnyAsync(t => t.Id == request.TipoLegaId);
        if (!tipoLegaExists)
        {
            request.TipoLegaId = 1; // Default: Partita Singola
        }

        if (request.TipoLegaId == 2 && (!request.NumeroSquadre.HasValue || request.NumeroSquadre.Value < 2))
        {
            return BadRequest("Per un Campionato è necessario indicare un numero valido di squadre (almeno 2).");
        }

        if (request.TipoLegaId == 3 && (!request.NumeroGironi.HasValue || request.NumeroGironi.Value < 1))
        {
            return BadRequest("Per un Torneo è necessario indicare un numero valido di gironi (almeno 1).");
        }

        var inviteCode = await GenerateUniqueInviteCode();

        var newLega = new Lega
        {
            Nome = leagueName,
            Descrizione = request.Descrizione,
            CodiceInvito = inviteCode,
            TipoLegaId = request.TipoLegaId,
            NumeroSquadre = request.TipoLegaId == 2 ? request.NumeroSquadre : null,
            NumeroGironi = request.TipoLegaId == 3 ? request.NumeroGironi : null
        };

        _context.Leghe.Add(newLega);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return BadRequest("Esiste già una lega con questo nome.");
        }

        var userLega = new UserLega
        {
            UserId = user.Id,
            LegaId = newLega.Id,
            RuoloId = LeagueRoles.SuperAdminId
        };

        _context.UserLeghe.Add(userLega);

        user.LegaId = newLega.Id;

        // Scrittura Log
        var log = new ActivityLog
        {
            LegaId = newLega.Id,
            EsecutoreId = user.Id,
            EsecutoreNome = $"{user.Nome} {user.Cognome}",
            EsecutoreRuolo = "SUPER_ADMIN",
            Azione = "CREAZIONE_LEGA",
            TargetUserId = user.Id,
            TargetUserNome = $"{user.Nome} {user.Cognome}",
            Dettagli = $"Ha creato la lega '{newLega.Nome}'.",
            Timestamp = DateTime.UtcNow
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync();

        return Ok(await MapToUserDtoWithLegheAsync(user));
    }

    [Authorize]
    [HttpPost("partecipa-lega")]
    public async Task<ActionResult<UserDto>> PartecipaLega(PartecipaLegaRequest request)
    {
        var userId = User.GetUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("Utente non trovato.");

        var codeUpper = request.CodiceLega.ToUpper();
        var lega = await _context.Leghe.SingleOrDefaultAsync(l => l.CodiceInvito == codeUpper);
        if (lega == null)
        {
            return NotFound("Codice non valido o lega non trovata.");
        }

        var exists = await _context.UserLeghe.AnyAsync(ul => ul.UserId == user.Id && ul.LegaId == lega.Id);
        if (!exists)
        {
            var userLega = new UserLega
            {
                UserId = user.Id,
                LegaId = lega.Id,
                RuoloId = LeagueRoles.GiocatoreId
            };
            _context.UserLeghe.Add(userLega);

            // Scrittura Log
            var log = new ActivityLog
            {
                LegaId = lega.Id,
                EsecutoreId = user.Id,
                EsecutoreNome = $"{user.Nome} {user.Cognome}",
                EsecutoreRuolo = "GIOCATORE",
                Azione = "ACCESSO_LEGA",
                TargetUserId = user.Id,
                TargetUserNome = $"{user.Nome} {user.Cognome}",
                Dettagli = $"Si è unito alla lega '{lega.Nome}' tramite codice invito.",
                Timestamp = DateTime.UtcNow
            };
            _context.ActivityLogs.Add(log);
        }

        user.LegaId = lega.Id;
        await _context.SaveChangesAsync();

        return Ok(await MapToUserDtoWithLegheAsync(user));
    }

    [Authorize]
    [HttpPost("cambia-lega")]
    public async Task<ActionResult<UserDto>> CambiaLega(CambiaLegaRequest request)
    {
        var userId = User.GetUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("Utente non trovato.");

        var isMember = await _context.UserLeghe.AnyAsync(ul => ul.UserId == user.Id && ul.LegaId == request.IdLega);
        if (!isMember)
        {
            return BadRequest("Non appartieni a questa lega.");
        }

        user.LegaId = request.IdLega;
        await _context.SaveChangesAsync();

        return Ok(await MapToUserDtoWithLegheAsync(user));
    }

    [Authorize]
    [HttpGet("lega/{legaId}/partecipanti")]
    public async Task<ActionResult<List<ParticipantDto>>> GetLegaPartecipanti(Guid legaId)
    {
        var userId = User.GetUserId();

        // Verify the requesting user belongs to the league
        var isMember = await _context.UserLeghe
            .AnyAsync(ul => ul.UserId == userId && ul.LegaId == legaId);

        if (!isMember)
        {
            return Forbid();
        }

        var partecipanti = await _context.UserLeghe
            .Where(ul => ul.LegaId == legaId)
            .OrderBy(ul => ul.Ruolo.Nome == "SUPER_ADMIN" ? 0
                : ul.Ruolo.Nome == "ADMIN" ? 1
                : ul.Ruolo.Nome == "CO_ADMIN" ? 2
                : 3)
            .ThenBy(ul => ul.User.Nome)
            .ThenBy(ul => ul.User.Cognome)
            .Select(ul => new ParticipantDto
            {
                UserId = ul.UserId,
                Nome = ul.User.Nome,
                Cognome = ul.User.Cognome,
                Email = ul.User.Email,
                Ruolo = ul.Ruolo.Nome
            })
            .ToListAsync();

        return Ok(partecipanti);
    }

    [Authorize]
    [HttpGet("lega/{legaId}/registri-attivita")]
    public async Task<ActionResult<List<ActivityLogDto>>> GetLegaRegistriAttivita(Guid legaId)
    {
        var userId = User.GetUserId();

        // Verifica se l'utente appartiene alla lega ed ha i permessi necessari (SUPER_ADMIN o ADMIN)
        var userLega = await _context.UserLeghe
            .SingleOrDefaultAsync(ul => ul.UserId == userId && ul.LegaId == legaId);

        if (userLega == null || 
            (userLega.RuoloId != LeagueRoles.SuperAdminId && 
             userLega.RuoloId != LeagueRoles.AdminId))
        {
            return StatusCode(403, "Non hai i permessi per accedere ai registri delle attività della lega.");
        }

        var logs = await _context.ActivityLogs
            .Where(al => al.LegaId == legaId)
            .OrderByDescending(al => al.Timestamp)
            .Select(al => new ActivityLogDto
            {
                Id = al.Id,
                EsecutoreId = al.EsecutoreId,
                EsecutoreNome = al.EsecutoreNome,
                EsecutoreRuolo = al.EsecutoreRuolo,
                Azione = al.Azione,
                TargetUserId = al.TargetUserId,
                TargetUserNome = al.TargetUserNome,
                Dettagli = al.Dettagli,
                Timestamp = al.Timestamp
            })
            .ToListAsync();

        return Ok(logs);
    }

    [Authorize]
    [HttpPost("lega/cambia-ruolo-partecipante")]
    public async Task<ActionResult> CambiaRuoloPartecipante(CambiaRuoloPartecipanteRequest request)
    {
        var userId = User.GetUserId();
        
        // Verifica se l'utente che fa la richiesta appartiene alla lega ed ha i permessi necessari (SUPER_ADMIN o ADMIN)
        var requesterUserLega = await _context.UserLeghe
            .Include(ul => ul.User)
            .Include(ul => ul.Ruolo)
            .SingleOrDefaultAsync(ul => ul.UserId == userId && ul.LegaId == request.LegaId);
        
        if (requesterUserLega == null || (requesterUserLega.RuoloId != LeagueRoles.SuperAdminId && requesterUserLega.RuoloId != LeagueRoles.AdminId))
        {
            return StatusCode(403, "Solo il super admin o gli admin possono modificare i ruoli.");
        }

        // Trova l'utente target nella lega
        var targetUserLega = await _context.UserLeghe
            .Include(ul => ul.User)
            .Include(ul => ul.Ruolo)
            .SingleOrDefaultAsync(ul => ul.UserId == request.TargetUserId && ul.LegaId == request.LegaId);

        if (targetUserLega == null)
        {
            return NotFound("Partecipante non trovato nella lega.");
        }

        // Non si può modificare il proprio ruolo
        if (request.TargetUserId == userId)
        {
            return BadRequest("Non puoi modificare il tuo stesso ruolo.");
        }

        // Se il richiedente è un ADMIN, può gestire solo Co-Admin e Giocatori (non può gestire Super Admin o altri Admin)
        if (requesterUserLega.RuoloId == LeagueRoles.AdminId && 
            (targetUserLega.RuoloId == LeagueRoles.SuperAdminId || targetUserLega.RuoloId == LeagueRoles.AdminId))
        {
            return StatusCode(403, "Gli admin non possono gestire i super admin o altri admin.");
        }

        // Determina il nuovo ruolo id
        int nuovoRuoloId;
        switch (request.NuovoRuolo.ToUpper())
        {
            case "ADMIN":
                nuovoRuoloId = LeagueRoles.AdminId;
                break;
            case "CO_ADMIN":
                nuovoRuoloId = LeagueRoles.CoAdminId;
                break;
            case "GIOCATORE":
                nuovoRuoloId = LeagueRoles.GiocatoreId;
                break;
            default:
                return BadRequest("Ruolo non valido. Può essere solo ADMIN, CO_ADMIN o GIOCATORE.");
        }

        // Memorizza il ruolo vecchio per il log
        string vecchioRuoloNome = targetUserLega.Ruolo.Nome;

        targetUserLega.RuoloId = nuovoRuoloId;

        // Scrittura Log
        var log = new ActivityLog
        {
            LegaId = request.LegaId,
            EsecutoreId = userId,
            EsecutoreNome = $"{requesterUserLega.User.Nome} {requesterUserLega.User.Cognome}",
            EsecutoreRuolo = requesterUserLega.Ruolo.Nome,
            Azione = "CAMBIO_RUOLO",
            TargetUserId = request.TargetUserId,
            TargetUserNome = $"{targetUserLega.User.Nome} {targetUserLega.User.Cognome}",
            Dettagli = $"Ha modificato il ruolo di {targetUserLega.User.Nome} {targetUserLega.User.Cognome} da {vecchioRuoloNome} a {request.NuovoRuolo.ToUpper()}.",
            Timestamp = DateTime.UtcNow
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync();

        return Ok();
    }

    [Authorize]
    [HttpPost("lega/rimuovi-partecipante")]
    public async Task<ActionResult> RimuoviPartecipante(RimuoviPartecipanteRequest request)
    {
        var userId = User.GetUserId();

        // Verifica se l'utente che fa la richiesta appartiene alla lega ed ha i permessi necessari
        var requesterUserLega = await _context.UserLeghe
            .Include(ul => ul.User)
            .Include(ul => ul.Ruolo)
            .SingleOrDefaultAsync(ul => ul.UserId == userId && ul.LegaId == request.LegaId);
        
        if (requesterUserLega == null || 
            (requesterUserLega.RuoloId != LeagueRoles.SuperAdminId && 
             requesterUserLega.RuoloId != LeagueRoles.AdminId && 
             requesterUserLega.RuoloId != LeagueRoles.CoAdminId))
        {
            return StatusCode(403, "Non hai i permessi per eseguire questa azione.");
        }

        // Trova l'utente target nella lega
        var targetUserLega = await _context.UserLeghe
            .Include(ul => ul.User)
            .Include(ul => ul.Ruolo)
            .SingleOrDefaultAsync(ul => ul.UserId == request.TargetUserId && ul.LegaId == request.LegaId);

        if (targetUserLega == null)
        {
            return NotFound("Partecipante non trovato nella lega.");
        }

        // Non si può rimuovere se stessi
        if (request.TargetUserId == userId)
        {
            return BadRequest("Non puoi rimuovere te stesso dalla lega. Se vuoi abbandonare, devi farlo dalle tue impostazioni profilo.");
        }

        // Se il richiedente è un ADMIN, può rimuovere solo Co-Admin e Giocatori (non può rimuovere Super Admin o altri Admin)
        if (requesterUserLega.RuoloId == LeagueRoles.AdminId && 
            (targetUserLega.RuoloId == LeagueRoles.SuperAdminId || targetUserLega.RuoloId == LeagueRoles.AdminId))
        {
            return StatusCode(403, "Gli admin non possono rimuovere i super admin o altri admin.");
        }

        // Se il richiedente è un Co-Admin, può rimuovere solo Giocatori semplici
        if (requesterUserLega.RuoloId == LeagueRoles.CoAdminId && targetUserLega.RuoloId != LeagueRoles.GiocatoreId)
        {
            return StatusCode(403, "I Co-Admin possono rimuovere solo i giocatori semplici.");
        }

        _context.UserLeghe.Remove(targetUserLega);

        // Se la lega attiva dell'utente rimosso era questa, resettala a null
        var targetUser = await _context.Users.FindAsync(request.TargetUserId);
        if (targetUser != null && targetUser.LegaId == request.LegaId)
        {
            targetUser.LegaId = null;
        }

        // Scrittura Log
        var log = new ActivityLog
        {
            LegaId = request.LegaId,
            EsecutoreId = userId,
            EsecutoreNome = $"{requesterUserLega.User.Nome} {requesterUserLega.User.Cognome}",
            EsecutoreRuolo = requesterUserLega.Ruolo.Nome,
            Azione = "RIMOZIONE_UTENTE",
            TargetUserId = request.TargetUserId,
            TargetUserNome = $"{targetUserLega.User.Nome} {targetUserLega.User.Cognome}",
            Dettagli = $"Ha rimosso {targetUserLega.User.Nome} {targetUserLega.User.Cognome} dalla lega.",
            Timestamp = DateTime.UtcNow
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync();

        return Ok();
    }

    [Authorize]
    [HttpPost("cambia-tema")]
    public async Task<ActionResult<UserDto>> CambiaTema(CambiaTemaRequest request)
    {
        var userId = User.GetUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("Utente non trovato.");

        var temaLower = request.Tema.ToLower();
        if (temaLower != "light" && temaLower != "dark")
        {
            return BadRequest("Tema non valido. Deve essere 'light' o 'dark'.");
        }

        user.Tema = temaLower;
        await _context.SaveChangesAsync();

        return Ok(await MapToUserDtoWithLegheAsync(user));
    }

    private async Task<bool> UserExists(string email)
    {
        return await _context.Users.AnyAsync(x => x.Email == email.Trim().ToLowerInvariant());
    }

    private async Task<UserDto> MapToUserDtoWithLegheAsync(User user)
    {
        var userLegheRaw = await _context.UserLeghe
            .Where(ul => ul.UserId == user.Id)
            .Include(ul => ul.Lega)
                .ThenInclude(l => l!.TipoLega)
            .Include(ul => ul.Ruolo)
            .ToListAsync();

        bool hasChanges = false;
        foreach (var ul in userLegheRaw)
        {
            if (ul.Lega != null && string.IsNullOrWhiteSpace(ul.Lega.CodiceInvito))
            {
                ul.Lega.CodiceInvito = await GenerateUniqueInviteCode();
                hasChanges = true;
            }
        }

        if (hasChanges)
        {
            await _context.SaveChangesAsync();
        }

        var userLeghe = userLegheRaw.Select(ul => new LegaDto
        {
            Id = ul.LegaId,
            Nome = ul.Lega.Nome,
            Ruolo = ul.Ruolo.Nome,
            CodiceInvito = ul.Lega.CodiceInvito,
            Descrizione = ul.Lega.Descrizione,
            TipoLegaId = ul.Lega.TipoLegaId,
            TipoLegaCodice = ul.Lega.TipoLega?.Codice ?? "PARTITA_SINGOLA",
            TipoLegaNome = ul.Lega.TipoLega?.Nome ?? "Partita Singola",
            NumeroSquadre = ul.Lega.NumeroSquadre,
            NumeroGironi = ul.Lega.NumeroGironi
        }).ToList();

        Console.WriteLine($"DEBUG [MapToUserDto]: User {user.Email}, Active LegaId: {user.LegaId}");
        foreach (var ul in userLeghe)
        {
            Console.WriteLine($"DEBUG [MapToUserDto]: Lega {ul.Id} ({ul.Nome}), CodiceInvito: '{ul.CodiceInvito}', Ruolo: {ul.Ruolo}");
        }

        return new UserDto
        {
            Id = user.Id,
            Nome = user.Nome,
            Cognome = user.Cognome,
            Email = user.Email,
            LegaId = user.LegaId,
            Tema = user.Tema,
            Leghe = userLeghe
        };
    }

    private async Task<string> GenerateUniqueInviteCode()
    {
        var random = new Random();
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        while (true)
        {
            var code = new string(Enumerable.Repeat(chars, 6)
                .Select(s => s[random.Next(s.Length)]).ToArray());

            if (!await _context.Leghe.AnyAsync(l => l.CodiceInvito == code))
            {
                return code;
            }
        }
    }
}
