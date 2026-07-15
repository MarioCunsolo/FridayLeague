namespace LineUp.Api.DTOs;

public class MatchPlayerDto
{
    public string Name { get; set; } = string.Empty;
    public int Goals { get; set; }
    public int Assists { get; set; }
}

public class GoalEventDto
{
    public string ScorerName { get; set; } = string.Empty;
    public bool IsHome { get; set; }
    public string? AssistName { get; set; }
}

public class MatchDto
{
    public int Id { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public string AwayTeam { get; set; } = string.Empty;
    public int HomeScore { get; set; }
    public int AwayScore { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public List<MatchPlayerDto> HomePlayers { get; set; } = new();
    public List<MatchPlayerDto> AwayPlayers { get; set; } = new();
    public List<GoalEventDto> GoalTimeline { get; set; } = new();
}
