using System.Security.Claims;

namespace LineUp.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var nameIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(nameIdClaim, out var id) ? id : Guid.Empty;
    }
}
