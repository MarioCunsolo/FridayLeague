using LineUp.Api.Data;

namespace LineUp.Api.Proxies;

public interface IStatsProxy
{
    Task<int?> GetActiveLegaIdAsync(int userId);
    Task<List<PartecipantePartita>> GetPartecipazioniAsync(int legaId, string? stagione);
    Task<List<EventoGol>> GetGolLegaAsync(int legaId, string? stagione);
}
