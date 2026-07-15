namespace LineUp.Api.DTOs;

public class AddGoalRequest
{
    public string ScorerName { get; set; } = string.Empty;
    public bool IsHome { get; set; }
    public string? AssistName { get; set; }
}
