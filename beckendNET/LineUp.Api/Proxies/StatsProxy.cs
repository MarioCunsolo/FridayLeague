using LineUp.Api.Data;
using LineUp.Api.Repositories;

namespace LineUp.Api.Proxies;

public class StatsProxy : IStatsProxy
{
    private readonly IPartecipantePartitaRepository _partecipanteRepository;
    private readonly IEventoGolRepository _eventoGolRepository;
    private readonly IUserLegaRepository _userLegaRepository;

    public StatsProxy(
        IPartecipantePartitaRepository partecipanteRepository,
        IEventoGolRepository eventoGolRepository,
        IUserLegaRepository userLegaRepository)
    {
        _partecipanteRepository = partecipanteRepository;
        _eventoGolRepository = eventoGolRepository;
        _userLegaRepository = userLegaRepository;
    }

    public Task<int?> GetActiveLegaIdAsync(int userId) => _userLegaRepository.GetActiveLegaIdAsync(userId);

    public Task<List<PartecipantePartita>> GetPartecipazioniAsync(int legaId, string? stagione) =>
        _partecipanteRepository.GetByLegaAsync(legaId, stagione);

    public Task<List<EventoGol>> GetGolLegaAsync(int legaId, string? stagione) =>
        _eventoGolRepository.GetByLegaAsync(legaId, stagione);
}
