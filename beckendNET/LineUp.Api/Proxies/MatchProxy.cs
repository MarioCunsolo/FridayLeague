using LineUp.Api.Data;
using LineUp.Api.Repositories;

namespace LineUp.Api.Proxies;

public class MatchProxy : IMatchProxy
{
    private readonly IPartitaRepository _partitaRepository;
    private readonly IPartecipantePartitaRepository _partecipanteRepository;
    private readonly IEventoGolRepository _eventoGolRepository;
    private readonly ISquadraRepository _squadraRepository;
    private readonly IUserLegaRepository _userLegaRepository;

    public MatchProxy(
        IPartitaRepository partitaRepository,
        IPartecipantePartitaRepository partecipanteRepository,
        IEventoGolRepository eventoGolRepository,
        ISquadraRepository squadraRepository,
        IUserLegaRepository userLegaRepository)
    {
        _partitaRepository = partitaRepository;
        _partecipanteRepository = partecipanteRepository;
        _eventoGolRepository = eventoGolRepository;
        _squadraRepository = squadraRepository;
        _userLegaRepository = userLegaRepository;
    }

    public Task<int?> GetActiveLegaIdAsync(int userId) => _userLegaRepository.GetActiveLegaIdAsync(userId);

    public Task<List<Partita>> GetPartiteAsync(int legaId) => _partitaRepository.GetByLegaAsync(legaId);
    public Task<Partita?> GetPartitaAsync(int id) => _partitaRepository.GetByIdAsync(id);
    public Task<List<PartecipantePartita>> GetPartecipantiAsync(int partitaId) => _partecipanteRepository.GetByPartitaAsync(partitaId);
    public Task<List<EventoGol>> GetGolAsync(int partitaId) => _eventoGolRepository.GetByPartitaAsync(partitaId);

    public Task<Squadra> GetOrCreateSquadraAsync(int legaId, string nome) => _squadraRepository.GetOrCreateAsync(legaId, nome);
    public Task<Partita> CreatePartitaAsync(Partita partita) => _partitaRepository.AddAsync(partita);
    public Task SalvaPartitaAsync() => _partitaRepository.SaveChangesAsync();
    public Task DeletePartitaAsync(Partita partita) => _partitaRepository.DeleteAsync(partita);

    public Task<User?> FindMembroByNomeCompletoAsync(int legaId, string nome) =>
        _userLegaRepository.FindMembroByNomeCompletoAsync(legaId, nome);

    public Task<PartecipantePartita?> FindPartecipanteByNomeAsync(int partitaId, string nome, bool isHome) =>
        _partecipanteRepository.FindByNomeInPartitaAsync(partitaId, nome, isHome);

    public Task AddPartecipantiAsync(IEnumerable<PartecipantePartita> partecipanti) =>
        _partecipanteRepository.AddRangeAsync(partecipanti);

    public async Task ReplacePartecipantiAsync(int partitaId, IEnumerable<PartecipantePartita> nuoviPartecipanti)
    {
        await _partecipanteRepository.RemoveByPartitaAsync(partitaId);
        await _partecipanteRepository.AddRangeAsync(nuoviPartecipanti);
    }

    public Task SalvaPartecipantiAsync() => _partecipanteRepository.SaveChangesAsync();

    public Task<EventoGol> AddGoalAsync(EventoGol evento) => _eventoGolRepository.AddAsync(evento);
}
