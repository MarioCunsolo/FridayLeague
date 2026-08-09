namespace LineUp.Api.DTOs;

public class ReservationDto
{
    public int Id { get; set; }
    public string NomeCognome { get; set; } = string.Empty;
    public DateTime DataOra { get; set; }
    public Guid? PlayerId { get; set; }
}

public class CreateReservationRequest
{
    public string NomeCognome { get; set; } = string.Empty;
}
