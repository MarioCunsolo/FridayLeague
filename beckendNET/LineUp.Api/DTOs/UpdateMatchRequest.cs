namespace LineUp.Api.DTOs;

public class UpdateMatchRequest
{
    public string? HomeTeam { get; set; }
    public string? AwayTeam { get; set; }
    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }
    public string? Status { get; set; }
    public DateTime? Date { get; set; }
}
