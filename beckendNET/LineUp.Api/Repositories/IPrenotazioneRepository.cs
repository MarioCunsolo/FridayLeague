using LineUp.Api.Data;

namespace LineUp.Api.Repositories;

public interface IPrenotazioneRepository
{
    Task<List<Prenotazione>> GetByPartitaAsync(int partitaId);
    Task<Prenotazione?> GetByIdAsync(int id);
    Task<Prenotazione?> GetByPartitaAndUserIdAsync(int partitaId, Guid userId);
    Task<Prenotazione> AddAsync(Prenotazione prenotazione);
    Task DeleteAsync(Prenotazione prenotazione);
}
