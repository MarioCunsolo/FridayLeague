using LineUp.Api.Data;

namespace LineUp.Api.Proxies;

public interface IPlayerProxy
{
    Task<int?> GetActiveLegaIdAsync(int userId);
    Task<List<User>> GetMembriAsync(int legaId);
    Task<User?> GetMembroAsync(int legaId, int userId);
    Task<List<PartecipantePartita>> GetPartecipazioniAsync(int legaId, string? stagione);
    Task<List<EventoGol>> GetGolLegaAsync(int legaId, string? stagione);
}
