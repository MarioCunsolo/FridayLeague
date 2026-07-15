namespace LineUp.Api.DTOs;

public class SetMotmRequest
{
    public string PlayerName { get; set; } = string.Empty;
    public bool IsHome { get; set; }
}
