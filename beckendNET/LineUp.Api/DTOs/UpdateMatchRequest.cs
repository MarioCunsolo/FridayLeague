namespace LineUp.Api.DTOs;

public class UpdateMatchRequest
{
    public string HomeTeam { get; set; } = string.Empty;
    public string AwayTeam { get; set; } = string.Empty;
    public DateTime Date { get; set; }
}
