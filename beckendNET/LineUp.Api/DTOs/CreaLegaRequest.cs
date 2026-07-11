using System.ComponentModel.DataAnnotations;

namespace LineUp.Api.DTOs;

public class CreaLegaRequest
{
    [Required(ErrorMessage = "Il nome della lega è obbligatorio")]
    [MinLength(3, ErrorMessage = "Il nome della lega deve contenere almeno 3 caratteri")]
    public string NomeLega { get; set; } = string.Empty;

    public string? Descrizione { get; set; }
}
