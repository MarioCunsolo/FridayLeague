namespace LineUp.Api.DTOs;

public class UserStatsDto
{
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
    public string Icon { get; set; } = string.Empty;
    public string ColorClass { get; set; } = string.Empty;
    public int? Rank { get; set; }
}
