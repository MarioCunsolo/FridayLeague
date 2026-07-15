using LineUp.Api.Data;

namespace LineUp.Api.Repositories;

public interface IUserLegaRepository
{
    Task<int?> GetActiveLegaIdAsync(int userId);
    Task<List<User>> GetMembriAsync(int legaId);
    Task<User?> FindMembroByNomeCompletoAsync(int legaId, string nomeCompleto);
}
