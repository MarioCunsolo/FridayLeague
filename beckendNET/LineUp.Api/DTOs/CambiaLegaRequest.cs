using System.ComponentModel.DataAnnotations;

namespace LineUp.Api.DTOs;

public class CambiaLegaRequest
{
    [Required]
    public Guid IdLega { get; set; }
}
