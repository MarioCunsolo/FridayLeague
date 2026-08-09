using LineUp.Api.Data;

namespace LineUp.Api.Repositories;

public interface IPartecipantePartitaRepository
{
    Task<List<PartecipantePartita>> GetByPartitaAsync(int partitaId);
    Task<PartecipantePartita?> FindByNomeInPartitaAsync(int partitaId, string nomeCompleto, bool isHome);
    Task<List<PartecipantePartita>> GetByLegaAsync(Guid legaId, string? stagione);
    Task AddRangeAsync(IEnumerable<PartecipantePartita> partecipanti);
    Task RemoveByPartitaAsync(int partitaId);
    Task SaveChangesAsync();
}
