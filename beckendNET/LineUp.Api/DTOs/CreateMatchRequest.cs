namespace LineUp.Api.DTOs;

public class CreateMatchRequest
{
    public string HomeTeam { get; set; } = string.Empty;
    public string AwayTeam { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? Status { get; set; }
}
