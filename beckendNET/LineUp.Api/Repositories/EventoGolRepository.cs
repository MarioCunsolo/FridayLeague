using LineUp.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LineUp.Api.Repositories;

public class EventoGolRepository : IEventoGolRepository
{
    private readonly LineUpDbContext _context;

    public EventoGolRepository(LineUpDbContext context)
    {
        _context = context;
    }

    public Task<List<EventoGol>> GetByPartitaAsync(int partitaId) =>
        _context.EventiGol
            .Where(g => g.PartitaId == partitaId)
            .Include(g => g.Marcatore)
            .Include(g => g.Assist)
            .OrderBy(g => g.Id)
            .ToListAsync();

    public async Task<EventoGol> AddAsync(EventoGol evento)
    {
        _context.EventiGol.Add(evento);
        await _context.SaveChangesAsync();
        return evento;
    }

    public Task<List<EventoGol>> GetByLegaAsync(Guid legaId, string? stagione) =>
        _context.EventiGol
            .Include(g => g.Marcatore)
            .Include(g => g.Assist)
            .Include(g => g.Partita)
            .Where(g => g.Partita.LegaId == legaId && (stagione == null || g.Partita.Stagione == stagione))
            .ToListAsync();
}
