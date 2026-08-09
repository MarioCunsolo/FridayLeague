using LineUp.Api.Data;

namespace LineUp.Api.Repositories;

public interface IEventoGolRepository
{
    Task<List<EventoGol>> GetByPartitaAsync(int partitaId);
    Task<EventoGol> AddAsync(EventoGol evento);
    Task<List<EventoGol>> GetByLegaAsync(Guid legaId, string? stagione);
}
