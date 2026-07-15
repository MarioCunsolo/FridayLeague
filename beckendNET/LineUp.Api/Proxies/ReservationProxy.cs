using LineUp.Api.Data;
using LineUp.Api.Repositories;

namespace LineUp.Api.Proxies;

public class ReservationProxy : IReservationProxy
{
    private readonly IPrenotazioneRepository _prenotazioneRepository;
    private readonly IPartitaRepository _partitaRepository;
    private readonly IUserLegaRepository _userLegaRepository;

    public ReservationProxy(
        IPrenotazioneRepository prenotazioneRepository,
        IPartitaRepository partitaRepository,
        IUserLegaRepository userLegaRepository)
    {
        _prenotazioneRepository = prenotazioneRepository;
        _partitaRepository = partitaRepository;
        _userLegaRepository = userLegaRepository;
    }

    public Task<int?> GetActiveLegaIdAsync(int userId) => _userLegaRepository.GetActiveLegaIdAsync(userId);
    public Task<Partita?> GetNextScheduledAsync(int legaId) => _partitaRepository.GetNextScheduledAsync(legaId);
    public Task<List<Prenotazione>> GetByPartitaAsync(int partitaId) => _prenotazioneRepository.GetByPartitaAsync(partitaId);
    public Task<Prenotazione?> GetByIdAsync(int id) => _prenotazioneRepository.GetByIdAsync(id);
    public Task<Prenotazione?> GetByPartitaAndUserIdAsync(int partitaId, int userId) =>
        _prenotazioneRepository.GetByPartitaAndUserIdAsync(partitaId, userId);
    public Task<User?> FindMembroByNomeCompletoAsync(int legaId, string nomeCompleto) =>
        _userLegaRepository.FindMembroByNomeCompletoAsync(legaId, nomeCompleto);
    public Task<Prenotazione> CreateAsync(Prenotazione prenotazione) => _prenotazioneRepository.AddAsync(prenotazione);
    public Task DeleteAsync(Prenotazione prenotazione) => _prenotazioneRepository.DeleteAsync(prenotazione);
}
