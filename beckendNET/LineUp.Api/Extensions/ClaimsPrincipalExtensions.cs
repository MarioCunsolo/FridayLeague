using System.Security.Claims;

namespace LineUp.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var nameIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(nameIdClaim, out var id) ? id : 0;
    }
}
