using System.Security.Claims;
using FridayLeague.Api.Data;
using FridayLeague.Api.DTOs;
using FridayLeague.Api.Services;
using FridayLeague.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FridayLeague.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly FridayLeagueDbContext _context;
    private readonly ITokenService _tokenService;

    public AuthController(FridayLeagueDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (await UserExists(request.Email))
        {
            return BadRequest("L'email è già registrata.");
        }

        var user = new User
        {
            Nome = request.Nome,
            Cognome = request.Cognome,
            Email = request.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var userDto = await MapToUserDtoWithLegheAsync(user);
        var token = _tokenService.CreateToken(user);

        return Ok(new AuthResponse
        {
            User = userDto,
            Token = token
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await _context.Users
            .SingleOrDefaultAsync(x => x.Email == request.Email.ToLower());

        if (user == null)
        {
            return Unauthorized("Credenziali non valide.");
        }

        var result = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!result)
        {
            return Unauthorized("Credenziali non valide.");
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

        return Ok(await MapToUserDtoWithLegheAsync(user));
    }

    [Authorize]
    [HttpPost("crea-lega")]
    public async Task<ActionResult<UserDto>> CreaLega(CreaLegaRequest request)
    {
        var userId = User.GetUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("Utente non trovato.");

        var inviteCode = await GenerateUniqueInviteCode();

        var newLega = new Lega
        {
            Nome = request.NomeLega,
            Descrizione = request.Descrizione,
            CodiceInvito = inviteCode
        };

        _context.Leghe.Add(newLega);
        await _context.SaveChangesAsync();

        var userLega = new UserLega
        {
            UserId = user.Id,
            LegaId = newLega.Id,
            RuoloId = LeagueRoles.AdminId
        };

        _context.UserLeghe.Add(userLega);

        user.LegaId = newLega.Id;
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
    public async Task<ActionResult<List<ParticipantDto>>> GetLegaPartecipanti(int legaId)
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
            .Include(ul => ul.User)
            .Include(ul => ul.Ruolo)
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
        return await _context.Users.AnyAsync(x => x.Email == email.ToLower());
    }

    private async Task<UserDto> MapToUserDtoWithLegheAsync(User user)
    {
        var userLeghe = await _context.UserLeghe
            .Where(ul => ul.UserId == user.Id)
            .Include(ul => ul.Lega)
            .Include(ul => ul.Ruolo)
            .Select(ul => new LegaDto
            {
                Id = ul.LegaId,
                Nome = ul.Lega.Nome,
                Ruolo = ul.Ruolo.Nome
            })
            .ToListAsync();

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
