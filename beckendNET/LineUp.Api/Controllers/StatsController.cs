using LineUp.Api.DTOs;
using LineUp.Api.Extensions;
using LineUp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LineUp.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/stats")]
public class StatsController : ApiControllerBase
{
    private readonly IStatsService _statsService;

    public StatsController(IStatsService statsService)
    {
        _statsService = statsService;
    }

    [HttpGet("scorers")]
    public Task<ActionResult<List<PlayerStatsDto>>> GetScorers() =>
        ExecuteAsync(() => _statsService.GetScorersAsync(User.GetUserId(), null));

    [HttpGet("scorers/{season}")]
    public Task<ActionResult<List<PlayerStatsDto>>> GetScorersPerStagione(string season) =>
        ExecuteAsync(() => _statsService.GetScorersAsync(User.GetUserId(), season));

    [HttpGet("assists")]
    public Task<ActionResult<List<PlayerStatsDto>>> GetAssists() =>
        ExecuteAsync(() => _statsService.GetAssistsAsync(User.GetUserId(), null));

    [HttpGet("assists/{season}")]
    public Task<ActionResult<List<PlayerStatsDto>>> GetAssistsPerStagione(string season) =>
        ExecuteAsync(() => _statsService.GetAssistsAsync(User.GetUserId(), season));

    [HttpGet("motm")]
    public Task<ActionResult<List<PlayerStatsDto>>> GetMotm() =>
        ExecuteAsync(() => _statsService.GetMotmAsync(User.GetUserId(), null));

    [HttpGet("motm/{season}")]
    public Task<ActionResult<List<PlayerStatsDto>>> GetMotmPerStagione(string season) =>
        ExecuteAsync(() => _statsService.GetMotmAsync(User.GetUserId(), season));
}
