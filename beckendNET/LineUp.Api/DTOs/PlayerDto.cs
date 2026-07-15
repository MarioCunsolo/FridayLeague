namespace LineUp.Api.DTOs;

public class PlayerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Goals { get; set; }
    public int Assists { get; set; }
}
