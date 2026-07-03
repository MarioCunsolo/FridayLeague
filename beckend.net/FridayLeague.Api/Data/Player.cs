namespace FridayLeague.Api.Data;

public class Player
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;

    public int TeamId { get; set; }
    public Team? Team { get; set; }
}
