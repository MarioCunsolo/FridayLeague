namespace LineUp.Api.DTOs;

public class SetupMatchLineupRequest
{
    public List<string> HomePlayerNames { get; set; } = new();
    public List<string> AwayPlayerNames { get; set; } = new();
}
