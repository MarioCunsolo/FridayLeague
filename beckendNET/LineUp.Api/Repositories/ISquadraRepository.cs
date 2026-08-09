using LineUp.Api.Data;

namespace LineUp.Api.Repositories;

public interface ISquadraRepository
{
    Task<Squadra> GetOrCreateAsync(Guid legaId, string nome);
    Task<Squadra?> GetByIdAsync(int id);
}
