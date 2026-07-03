using System.ComponentModel.DataAnnotations;

namespace FridayLeague.Api.DTOs;

public class CambiaLegaRequest
{
    [Required]
    public int IdLega { get; set; }
}
