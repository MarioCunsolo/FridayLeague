namespace LineUp.Api.DTOs;

public class PlayerStatsDto
{
    public string Name { get; set; } = string.Empty;
    public string Team { get; set; } = string.Empty;
    public int Value { get; set; }
    public string Avatar { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}
