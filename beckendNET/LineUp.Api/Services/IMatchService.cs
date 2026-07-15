using LineUp.Api.DTOs;

namespace LineUp.Api.Services;

public interface IMatchService
{
    Task<List<MatchDto>> GetMatchesAsync(int userId);
    Task<MatchDto> CreateMatchAsync(int userId, CreateMatchRequest request);
    Task<MatchDto> UpdateMatchAsync(int userId, int matchId, UpdateMatchRequest request);
    Task DeleteMatchAsync(int userId, int matchId);
    Task<MatchDto> AnnullaMatchAsync(int userId, int matchId);
    Task<GoalEventDto> AddGoalAsync(int userId, int matchId, AddGoalRequest request);
    Task SetMotmAsync(int userId, int matchId, SetMotmRequest request);
}
