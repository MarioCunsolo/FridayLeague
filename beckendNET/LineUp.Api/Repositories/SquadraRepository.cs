using LineUp.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LineUp.Api.Repositories;

public class SquadraRepository : ISquadraRepository
{
    private readonly LineUpDbContext _context;

    public SquadraRepository(LineUpDbContext context)
    {
        _context = context;
    }

    public async Task<Squadra> GetOrCreateAsync(int legaId, string nome)
    {
        var nomeTrim = nome.Trim();
        var esistente = await _context.Squadre
            .SingleOrDefaultAsync(s => s.LegaId == legaId && s.Nome.ToLower() == nomeTrim.ToLower());

        if (esistente != null)
        {
            return esistente;
        }

        var nuova = new Squadra { LegaId = legaId, Nome = nomeTrim };
        _context.Squadre.Add(nuova);
        await _context.SaveChangesAsync();
        return nuova;
    }

    public Task<Squadra?> GetByIdAsync(int id) => _context.Squadre.FindAsync(id).AsTask();
}
