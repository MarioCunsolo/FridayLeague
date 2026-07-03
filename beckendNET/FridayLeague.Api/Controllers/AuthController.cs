using System.Security.Claims;
using FridayLeague.Api.Data;
using FridayLeague.Api.DTOs;
using FridayLeague.Api.Services;
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

        var userDto = MapToUserDto(user);
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

        var userDto = MapToUserDto(user);
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
        var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value 
            ?? User.FindFirst("email")?.Value;

        if (string.IsNullOrEmpty(emailClaim))
        {
            return Unauthorized();
        }

        var user = await _context.Users
            .SingleOrDefaultAsync(x => x.Email == emailClaim);

        if (user == null)
        {
            return NotFound("Utente non trovato.");
        }

        return Ok(MapToUserDto(user));
    }

    private async Task<bool> UserExists(string email)
    {
        return await _context.Users.AnyAsync(x => x.Email == email.ToLower());
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Nome = user.Nome,
            Cognome = user.Cognome,
            Email = user.Email,
            LegaId = user.LegaId,
            Leghe = new List<LegaDto>()
        };
    }
}
