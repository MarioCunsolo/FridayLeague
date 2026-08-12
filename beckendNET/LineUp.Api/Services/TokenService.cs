using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LineUp.Api.Data;
using Microsoft.IdentityModel.Tokens;

namespace LineUp.Api.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;
    private readonly SymmetricSecurityKey _key;

    public TokenService(IConfiguration config)
    {
        _config = config;
        var tokenKey = _config["JwtSettings:TokenKey"];
        if (string.IsNullOrWhiteSpace(tokenKey))
        {
            throw new ArgumentNullException("JwtSettings:TokenKey", "JWT Key is not configured.");
        }

        if (Encoding.UTF8.GetByteCount(tokenKey) < 64)
        {
            throw new ArgumentException("JWT Key must be at least 64 bytes for HMAC-SHA512.", "JwtSettings:TokenKey");
        }

        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey));
    }

    public string CreateToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.NameId, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.GivenName, user.Nome),
            new Claim(JwtRegisteredClaimNames.FamilyName, user.Cognome)
        };

        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha512Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.Now.AddDays(7),
            SigningCredentials = creds,
            Issuer = _config["JwtSettings:Issuer"],
            Audience = _config["JwtSettings:Audience"]
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}
