using LineUp.Api.Data;

namespace LineUp.Api.Proxies;

public interface IStatsProxy
{
    Task<Guid?> GetActiveLegaIdAsync(Guid userId);
    Task<List<User>> GetMembriAsync(Guid legaId);
    Task<List<PartecipantePartita>> GetPartecipazioniAsync(Guid legaId, string? stagione);
    Task<List<EventoGol>> GetGolLegaAsync(Guid legaId, string? stagione);
}
