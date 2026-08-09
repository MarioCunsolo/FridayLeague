using LineUp.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LineUp.Api.Repositories;

public class PrenotazioneRepository : IPrenotazioneRepository
{
    private readonly LineUpDbContext _context;

    public PrenotazioneRepository(LineUpDbContext context)
    {
        _context = context;
    }

    public Task<List<Prenotazione>> GetByPartitaAsync(int partitaId) =>
        _context.Prenotazioni
            .Where(r => r.PartitaId == partitaId)
            .Include(r => r.User)
            .OrderBy(r => r.DataOra)
            .ToListAsync();

    public Task<Prenotazione?> GetByIdAsync(int id) =>
        _context.Prenotazioni.Include(r => r.User).SingleOrDefaultAsync(r => r.Id == id);

    public Task<Prenotazione?> GetByPartitaAndUserIdAsync(int partitaId, Guid userId) =>
        _context.Prenotazioni.SingleOrDefaultAsync(r => r.PartitaId == partitaId && r.UserId == userId);

    public async Task<Prenotazione> AddAsync(Prenotazione prenotazione)
    {
        _context.Prenotazioni.Add(prenotazione);
        await _context.SaveChangesAsync();
        return prenotazione;
    }

    public Task DeleteAsync(Prenotazione prenotazione)
    {
        _context.Prenotazioni.Remove(prenotazione);
        return _context.SaveChangesAsync();
    }
}
