using System.Text.Json.Serialization;

namespace FridayLeague.Api.Data;

public class Team
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int FoundedYear { get; set; }

    [JsonIgnore]
    public ICollection<Player> Players { get; set; } = new List<Player>();
}
