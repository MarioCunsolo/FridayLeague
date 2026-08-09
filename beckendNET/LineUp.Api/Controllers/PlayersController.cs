using LineUp.Api.DTOs;
using LineUp.Api.Extensions;
using LineUp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LineUp.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/players")]
public class PlayersController : ApiControllerBase
{
    private readonly IPlayerService _playerService;

    public PlayersController(IPlayerService playerService)
    {
        _playerService = playerService;
    }

    [HttpGet]
    public Task<ActionResult<List<PlayerDto>>> GetAll() =>
        ExecuteAsync(() => _playerService.GetPlayersAsync(User.GetUserId()));

    [HttpGet("{id}")]
    public Task<ActionResult<PlayerDto>> GetById(Guid id) =>
        ExecuteAsync(() => _playerService.GetPlayerByIdAsync(User.GetUserId(), id));

    [HttpGet("{id}/stats")]
    public Task<ActionResult<List<UserStatsDto>>> GetStats(Guid id) =>
        ExecuteAsync(() => _playerService.GetPlayerStatsAsync(User.GetUserId(), id, null));

    [HttpGet("{id}/stats/{season}")]
    public Task<ActionResult<List<UserStatsDto>>> GetStatsPerStagione(Guid id, string season) =>
        ExecuteAsync(() => _playerService.GetPlayerStatsAsync(User.GetUserId(), id, season));
}
