using LineUp.Api.DTOs;

namespace LineUp.Api.Services;

public interface IPlayerService
{
    Task<List<PlayerDto>> GetPlayersAsync(int userId);
    Task<PlayerDto> GetPlayerByIdAsync(int userId, int playerId);
    Task<List<UserStatsDto>> GetPlayerStatsAsync(int userId, int playerId, string? season);
}
