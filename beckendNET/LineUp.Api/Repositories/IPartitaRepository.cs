using LineUp.Api.Data;

namespace LineUp.Api.Repositories;

public interface IPartitaRepository
{
    Task<List<Partita>> GetByLegaAsync(int legaId);
    Task<Partita?> GetByIdAsync(int id);
    Task<Partita?> GetNextScheduledAsync(int legaId);
    Task<Partita> AddAsync(Partita partita);
    Task DeleteAsync(Partita partita);
    Task SaveChangesAsync();
}
