using LineUp.Api.DTOs;
using LineUp.Api.Extensions;
using LineUp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LineUp.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/reservations")]
public class ReservationsController : ApiControllerBase
{
    private readonly IReservationService _reservationService;

    public ReservationsController(IReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    [HttpGet]
    public Task<ActionResult<List<ReservationDto>>> GetAll() =>
        ExecuteAsync(() => _reservationService.GetReservationsAsync(User.GetUserId()));

    [HttpPost]
    public Task<ActionResult<ReservationDto>> Create(CreateReservationRequest request) =>
        ExecuteAsync(() => _reservationService.CreateReservationAsync(User.GetUserId(), request));

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id) =>
        ExecuteAsync(() => _reservationService.DeleteReservationAsync(User.GetUserId(), id));

    [HttpPost("seed-dummy")]
    public Task<ActionResult<List<ReservationDto>>> SeedDummy() =>
        ExecuteAsync(() => _reservationService.SeedDummyReservationsAsync(User.GetUserId()));
}
