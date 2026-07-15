using LineUp.Api.Data;
using LineUp.Api.Repositories;

namespace LineUp.Api.Proxies;

public class PlayerProxy : IPlayerProxy
{
    private readonly IUserLegaRepository _userLegaRepository;
    private readonly IPartecipantePartitaRepository _partecipanteRepository;
    private readonly IEventoGolRepository _eventoGolRepository;

    public PlayerProxy(
        IUserLegaRepository userLegaRepository,
        IPartecipantePartitaRepository partecipanteRepository,
        IEventoGolRepository eventoGolRepository)
    {
        _userLegaRepository = userLegaRepository;
        _partecipanteRepository = partecipanteRepository;
        _eventoGolRepository = eventoGolRepository;
    }

    public Task<int?> GetActiveLegaIdAsync(int userId) => _userLegaRepository.GetActiveLegaIdAsync(userId);

    public async Task<List<User>> GetMembriAsync(int legaId) => await _userLegaRepository.GetMembriAsync(legaId);

    public async Task<User?> GetMembroAsync(int legaId, int userId)
    {
        var membri = await _userLegaRepository.GetMembriAsync(legaId);
        return membri.SingleOrDefault(u => u.Id == userId);
    }

    public Task<List<PartecipantePartita>> GetPartecipazioniAsync(int legaId, string? stagione) =>
        _partecipanteRepository.GetByLegaAsync(legaId, stagione);

    public Task<List<EventoGol>> GetGolLegaAsync(int legaId, string? stagione) =>
        _eventoGolRepository.GetByLegaAsync(legaId, stagione);
}
