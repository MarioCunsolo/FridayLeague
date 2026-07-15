using LineUp.Api.Data;

namespace LineUp.Api.Proxies;

public interface IReservationProxy
{
    Task<int?> GetActiveLegaIdAsync(int userId);
    Task<Partita?> GetNextScheduledAsync(int legaId);
    Task<List<Prenotazione>> GetByPartitaAsync(int partitaId);
    Task<Prenotazione?> GetByIdAsync(int id);
    Task<Prenotazione?> GetByPartitaAndUserIdAsync(int partitaId, int userId);
    Task<User?> FindMembroByNomeCompletoAsync(int legaId, string nomeCompleto);
    Task<Prenotazione> CreateAsync(Prenotazione prenotazione);
    Task DeleteAsync(Prenotazione prenotazione);
}
