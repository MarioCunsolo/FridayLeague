using LineUp.Api.Data;

namespace LineUp.Api.Proxies;

public interface IMatchProxy
{
    Task<int?> GetActiveLegaIdAsync(int userId);

    Task<List<Partita>> GetPartiteAsync(int legaId);
    Task<Partita?> GetPartitaAsync(int id);
    Task<List<PartecipantePartita>> GetPartecipantiAsync(int partitaId);
    Task<List<EventoGol>> GetGolAsync(int partitaId);

    Task<Squadra> GetOrCreateSquadraAsync(int legaId, string nome);
    Task<Partita> CreatePartitaAsync(Partita partita);
    Task SalvaPartitaAsync();
    Task DeletePartitaAsync(Partita partita);

    Task<User?> FindMembroByNomeCompletoAsync(int legaId, string nome);
    Task<PartecipantePartita?> FindPartecipanteByNomeAsync(int partitaId, string nome, bool isHome);
    Task AddPartecipantiAsync(IEnumerable<PartecipantePartita> partecipanti);
    Task SalvaPartecipantiAsync();
    Task<EventoGol> AddGoalAsync(EventoGol evento);
}
