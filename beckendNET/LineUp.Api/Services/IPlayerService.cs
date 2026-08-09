using LineUp.Api.DTOs;

namespace LineUp.Api.Services;

public interface IPlayerService
{
    Task<List<PlayerDto>> GetPlayersAsync(Guid userId);
    Task<PlayerDto> GetPlayerByIdAsync(Guid userId, Guid playerId);
    Task<List<UserStatsDto>> GetPlayerStatsAsync(Guid userId, Guid playerId, string? season);
}
