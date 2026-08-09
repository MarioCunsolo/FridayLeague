using LineUp.Api.DTOs;

namespace LineUp.Api.Services;

public interface IStatsService
{
    Task<List<PlayerStatsDto>> GetScorersAsync(Guid userId, string? season);
    Task<List<PlayerStatsDto>> GetAssistsAsync(Guid userId, string? season);
    Task<List<PlayerStatsDto>> GetMotmAsync(Guid userId, string? season);
}
