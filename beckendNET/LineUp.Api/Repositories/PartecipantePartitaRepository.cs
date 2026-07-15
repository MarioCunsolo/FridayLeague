using LineUp.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LineUp.Api.Repositories;

public class PartecipantePartitaRepository : IPartecipantePartitaRepository
{
    private readonly LineUpDbContext _context;

    public PartecipantePartitaRepository(LineUpDbContext context)
    {
        _context = context;
    }

    public Task<List<PartecipantePartita>> GetByPartitaAsync(int partitaId) =>
        _context.PartecipantiPartita
            .Where(pp => pp.PartitaId == partitaId)
            .Include(pp => pp.User)
            .ToListAsync();

    public async Task<PartecipantePartita?> FindByNomeInPartitaAsync(int partitaId, string nomeCompleto, bool isHome)
    {
        var target = nomeCompleto.Trim().ToLower();
        var partecipanti = await _context.PartecipantiPartita
            .Where(pp => pp.PartitaId == partitaId && pp.InCasa == isHome)
            .Include(pp => pp.User)
            .ToListAsync();

        return partecipanti.SingleOrDefault(pp => $"{pp.User.Nome} {pp.User.Cognome}".Trim().ToLower() == target);
    }

    public Task<List<PartecipantePartita>> GetByLegaAsync(int legaId, string? stagione) =>
        _context.PartecipantiPartita
            .Include(pp => pp.User)
            .Include(pp => pp.Partita).ThenInclude(p => p.SquadraCasa)
            .Include(pp => pp.Partita).ThenInclude(p => p.SquadraTrasferta)
            .Where(pp => pp.Partita.LegaId == legaId && (stagione == null || pp.Partita.Stagione == stagione))
            .ToListAsync();

    public async Task AddRangeAsync(IEnumerable<PartecipantePartita> partecipanti)
    {
        _context.PartecipantiPartita.AddRange(partecipanti);
        await _context.SaveChangesAsync();
    }

    public Task SaveChangesAsync() => _context.SaveChangesAsync();
}
