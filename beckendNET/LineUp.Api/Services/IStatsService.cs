using LineUp.Api.DTOs;

namespace LineUp.Api.Services;

public interface IStatsService
{
    Task<List<PlayerStatsDto>> GetScorersAsync(int userId, string? season);
    Task<List<PlayerStatsDto>> GetAssistsAsync(int userId, string? season);
    Task<List<PlayerStatsDto>> GetMotmAsync(int userId, string? season);
}
