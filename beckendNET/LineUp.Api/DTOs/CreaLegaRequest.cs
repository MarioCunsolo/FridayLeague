using System.ComponentModel.DataAnnotations;

namespace LineUp.Api.DTOs;

public class CreaLegaRequest
{
    [Required(ErrorMessage = "Il nome della lega è obbligatorio")]
    [MinLength(3, ErrorMessage = "Il nome della lega deve contenere almeno 3 caratteri")]
    [MaxLength(255, ErrorMessage = "Il nome della lega non può superare i 255 caratteri")]
    public string NomeLega { get; set; } = string.Empty;

    public string? Descrizione { get; set; }

    public int TipoLegaId { get; set; } = 1;

    public int? NumeroSquadre { get; set; }

    public int? NumeroGironi { get; set; }
}
