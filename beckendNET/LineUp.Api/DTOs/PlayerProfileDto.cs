namespace LineUp.Api.DTOs;

public class PlayerProfileDto
{
    public string Season { get; set; } = string.Empty;
    public PlayerProfileSummaryDto Summary { get; set; } = new();
    public List<UserStatsDto> Stats { get; set; } = [];
    public List<PlayerMatchSummaryDto> RecentMatches { get; set; } = [];
    public List<PlayerPerformancePointDto> Performance { get; set; } = [];
    public NextMatchReservationDto? NextMatch { get; set; }
}

public class PlayerProfileSummaryDto
{
    public int Goals { get; set; }
    public int Assists { get; set; }
    public int Motm { get; set; }
    public int MatchesPlayed { get; set; }
    public int TotalLeagueMatches { get; set; }
    public int GoalRank { get; set; }
    public int AssistRank { get; set; }
    public int MotmRank { get; set; }
    public decimal GoalsPerMatch { get; set; }
    public decimal AssistsPerMatch { get; set; }
    public decimal ParticipationRate { get; set; }
    public decimal LeagueAverageGoals { get; set; }
    public decimal LeagueAverageAssists { get; set; }
}

public class PlayerMatchSummaryDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public string AwayTeam { get; set; } = string.Empty;
    public int HomeScore { get; set; }
    public int AwayScore { get; set; }
    public string PlayerTeam { get; set; } = string.Empty;
    public int Goals { get; set; }
    public int Assists { get; set; }
    public bool IsMotm { get; set; }
}

public class PlayerPerformancePointDto
{
    public int MatchId { get; set; }
    public DateTime Date { get; set; }
    public int Goals { get; set; }
    public int Assists { get; set; }
}

public class NextMatchReservationDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public string AwayTeam { get; set; } = string.Empty;
    public bool IsReserved { get; set; }
}
