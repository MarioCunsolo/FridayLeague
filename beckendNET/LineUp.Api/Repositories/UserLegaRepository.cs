using LineUp.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LineUp.Api.Repositories;

public class UserLegaRepository : IUserLegaRepository
{
    private readonly LineUpDbContext _context;

    public UserLegaRepository(LineUpDbContext context)
    {
        _context = context;
    }

    public async Task<Guid?> GetActiveLegaIdAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user?.LegaId;
    }

    public Task<List<User>> GetMembriAsync(Guid legaId) =>
        _context.UserLeghe
            .Where(ul => ul.LegaId == legaId)
            .Include(ul => ul.User)
            .Select(ul => ul.User)
            .ToListAsync();

    public async Task<User?> FindMembroByNomeCompletoAsync(Guid legaId, string nomeCompleto)
    {
        var target = nomeCompleto.Trim().ToLower();
        var membri = await GetMembriAsync(legaId);
        return membri.SingleOrDefault(u => $"{u.Nome} {u.Cognome}".Trim().ToLower() == target);
    }
}
