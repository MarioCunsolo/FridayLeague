using LineUp.Api.DTOs;

namespace LineUp.Api.Services;

public interface IReservationService
{
    Task<List<ReservationDto>> GetReservationsAsync(int userId);
    Task<ReservationDto> CreateReservationAsync(int userId, CreateReservationRequest request);
    Task DeleteReservationAsync(int userId, int playerId);
}
