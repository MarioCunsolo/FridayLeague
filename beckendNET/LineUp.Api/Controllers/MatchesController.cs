using LineUp.Api.DTOs;
using LineUp.Api.Extensions;
using LineUp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LineUp.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/matches")]
public class MatchesController : ApiControllerBase
{
    private readonly IMatchService _matchService;

    public MatchesController(IMatchService matchService)
    {
        _matchService = matchService;
    }

    [HttpGet]
    public Task<ActionResult<List<MatchDto>>> GetAll() =>
        ExecuteAsync(() => _matchService.GetMatchesAsync(User.GetUserId()));

    [HttpPost]
    public Task<ActionResult<MatchDto>> Create(CreateMatchRequest request) =>
        ExecuteAsync(() => _matchService.CreateMatchAsync(User.GetUserId(), request));

    [HttpPut("{id}")]
    public Task<ActionResult<MatchDto>> Update(int id, UpdateMatchRequest request) =>
        ExecuteAsync(() => _matchService.UpdateMatchAsync(User.GetUserId(), id, request));

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id) =>
        ExecuteAsync(() => _matchService.DeleteMatchAsync(User.GetUserId(), id));

    [HttpPut("{id}/annulla")]
    public Task<ActionResult<MatchDto>> Annulla(int id) =>
        ExecuteAsync(() => _matchService.AnnullaMatchAsync(User.GetUserId(), id));

    [HttpPut("{id}/inizia")]
    public Task<ActionResult<MatchDto>> Inizia(int id) =>
        ExecuteAsync(() => _matchService.IniziaMatchAsync(User.GetUserId(), id));

    [HttpPut("{id}/concludi")]
    public Task<ActionResult<MatchDto>> Concludi(int id) =>
        ExecuteAsync(() => _matchService.ConcludiMatchAsync(User.GetUserId(), id));

    [HttpPost("{id}/goals")]
    public Task<ActionResult<GoalEventDto>> AddGoal(int id, AddGoalRequest request) =>
        ExecuteAsync(() => _matchService.AddGoalAsync(User.GetUserId(), id, request));

    [HttpPut("{id}/motm")]
    public Task<IActionResult> SetMotm(int id, SetMotmRequest request) =>
        ExecuteAsync(() => _matchService.SetMotmAsync(User.GetUserId(), id, request));

    [HttpPost("{id}/setup-lineup")]
    public Task<ActionResult<MatchDto>> SetupLineup(int id, SetupMatchLineupRequest request) =>
        ExecuteAsync(() => _matchService.SetupLineupAsync(User.GetUserId(), id, request));
}
