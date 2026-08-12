using LineUp.Api.Data;

namespace LineUp.Api.Proxies;

public interface IPlayerProxy
{
    Task<Guid?> GetActiveLegaIdAsync(Guid userId);
    Task<List<User>> GetMembriAsync(Guid legaId);
    Task<User?> GetMembroAsync(Guid legaId, Guid userId);
    Task<List<Partita>> GetPartiteAsync(Guid legaId);
    Task<List<PartecipantePartita>> GetPartecipazioniAsync(Guid legaId, string? stagione);
    Task<List<EventoGol>> GetGolLegaAsync(Guid legaId, string? stagione);
    Task<Partita?> GetProssimaPartitaAsync(Guid legaId);
    Task<Prenotazione?> GetPrenotazioneAsync(int partitaId, Guid userId);
}
