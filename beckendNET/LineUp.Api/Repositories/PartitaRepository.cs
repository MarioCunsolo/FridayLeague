using LineUp.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LineUp.Api.Repositories;

public class PartitaRepository : IPartitaRepository
{
    private readonly LineUpDbContext _context;

    public PartitaRepository(LineUpDbContext context)
    {
        _context = context;
    }

    public Task<List<Partita>> GetByLegaAsync(int legaId) =>
        _context.Partite
            .Where(p => p.LegaId == legaId)
            .Include(p => p.SquadraCasa)
            .Include(p => p.SquadraTrasferta)
            .Include(p => p.Stato)
            .OrderByDescending(p => p.DataOra)
            .ToListAsync();

    public Task<Partita?> GetByIdAsync(int id) =>
        _context.Partite
            .Include(p => p.SquadraCasa)
            .Include(p => p.SquadraTrasferta)
            .Include(p => p.Stato)
            .SingleOrDefaultAsync(p => p.Id == id);

    public Task<Partita?> GetNextScheduledAsync(int legaId) =>
        _context.Partite
            .Where(p => p.LegaId == legaId && p.StatoId == StatoPartita.ProgrammataId)
            .Include(p => p.SquadraCasa)
            .Include(p => p.SquadraTrasferta)
            .Include(p => p.Stato)
            .OrderBy(p => p.DataOra)
            .FirstOrDefaultAsync();

    public async Task<Partita> AddAsync(Partita partita)
    {
        _context.Partite.Add(partita);
        await _context.SaveChangesAsync();
        return partita;
    }

    public Task DeleteAsync(Partita partita)
    {
        _context.Partite.Remove(partita);
        return _context.SaveChangesAsync();
    }

    public Task SaveChangesAsync() => _context.SaveChangesAsync();
}
