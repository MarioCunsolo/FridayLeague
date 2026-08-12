using LineUp.Api.DTOs;

namespace LineUp.Api.Services;

public interface IReservationService
{
    Task<List<ReservationDto>> GetReservationsAsync(Guid userId);
    Task<ReservationDto> CreateReservationAsync(Guid userId, CreateReservationRequest request);
    Task DeleteReservationAsync(Guid userId, int reservationId);
    Task<List<ReservationDto>> SeedDummyReservationsAsync(Guid userId);
}
