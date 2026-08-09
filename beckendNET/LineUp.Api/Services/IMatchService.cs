using LineUp.Api.DTOs;

namespace LineUp.Api.Services;

public interface IMatchService
{
    Task<List<MatchDto>> GetMatchesAsync(Guid userId);
    Task<MatchDto> CreateMatchAsync(Guid userId, CreateMatchRequest request);
    Task<MatchDto> UpdateMatchAsync(Guid userId, int matchId, UpdateMatchRequest request);
    Task DeleteMatchAsync(Guid userId, int matchId);
    Task<MatchDto> AnnullaMatchAsync(Guid userId, int matchId);
    Task<MatchDto> IniziaMatchAsync(Guid userId, int matchId);
    Task<MatchDto> ConcludiMatchAsync(Guid userId, int matchId);
    Task<GoalEventDto> AddGoalAsync(Guid userId, int matchId, AddGoalRequest request);
    Task SetMotmAsync(Guid userId, int matchId, SetMotmRequest request);
    Task<MatchDto> SetupLineupAsync(Guid userId, int matchId, SetupMatchLineupRequest request);
}
