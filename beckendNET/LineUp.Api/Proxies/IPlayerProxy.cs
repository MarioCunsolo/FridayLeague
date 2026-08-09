using LineUp.Api.Data;

namespace LineUp.Api.Proxies;

public interface IPlayerProxy
{
    Task<Guid?> GetActiveLegaIdAsync(Guid userId);
    Task<List<User>> GetMembriAsync(Guid legaId);
    Task<User?> GetMembroAsync(Guid legaId, Guid userId);
    Task<List<PartecipantePartita>> GetPartecipazioniAsync(Guid legaId, string? stagione);
    Task<List<EventoGol>> GetGolLegaAsync(Guid legaId, string? stagione);
}
