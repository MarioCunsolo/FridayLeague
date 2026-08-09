using LineUp.Api.Data;

namespace LineUp.Api.Proxies;

public interface IReservationProxy
{
    Task<Guid?> GetActiveLegaIdAsync(Guid userId);
    Task<Partita?> GetNextScheduledAsync(Guid legaId);
    Task<List<Prenotazione>> GetByPartitaAsync(int partitaId);
    Task<Prenotazione?> GetByIdAsync(int id);
    Task<Prenotazione?> GetByPartitaAndUserIdAsync(int partitaId, Guid userId);
    Task<User?> FindMembroByNomeCompletoAsync(Guid legaId, string nomeCompleto);
    Task<Prenotazione> CreateAsync(Prenotazione prenotazione);
    Task DeleteAsync(Prenotazione prenotazione);
}
