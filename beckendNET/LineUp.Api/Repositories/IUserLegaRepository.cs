using LineUp.Api.Data;

namespace LineUp.Api.Repositories;

public interface IUserLegaRepository
{
    Task<Guid?> GetActiveLegaIdAsync(Guid userId);
    Task<List<User>> GetMembriAsync(Guid legaId);
    Task<User?> FindMembroByNomeCompletoAsync(Guid legaId, string nomeCompleto);
}
