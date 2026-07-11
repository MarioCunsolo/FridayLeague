using FridayLeague.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FridayLeague.Api.Services;

public class AuthorizationHelper : IAuthorizationHelper
{
    private readonly FridayLeagueDbContext _context;

    public AuthorizationHelper(FridayLeagueDbContext context)
    {
        _context = context;
    }

    public async Task<bool> IsAdminOrCoAdminAsync(int userId, int legaId)
    {
        var member = await _context.UserLeghe
            .SingleOrDefaultAsync(ul => ul.UserId == userId && ul.LegaId == legaId);

        if (member == null) return false;

        return member.RuoloId == LeagueRoles.SuperAdminId || member.RuoloId == LeagueRoles.AdminId || member.RuoloId == LeagueRoles.CoAdminId;
    }
}
