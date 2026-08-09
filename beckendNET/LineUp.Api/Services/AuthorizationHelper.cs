using LineUp.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LineUp.Api.Services;

public class AuthorizationHelper : IAuthorizationHelper
{
    private readonly LineUpDbContext _context;

    public AuthorizationHelper(LineUpDbContext context)
    {
        _context = context;
    }

    public async Task<bool> IsAdminOrCoAdminAsync(Guid userId, Guid legaId)
    {
        var member = await _context.UserLeghe
            .SingleOrDefaultAsync(ul => ul.UserId == userId && ul.LegaId == legaId);

        if (member == null) return false;

        return member.RuoloId == LeagueRoles.SuperAdminId || member.RuoloId == LeagueRoles.AdminId || member.RuoloId == LeagueRoles.CoAdminId;
    }
}
