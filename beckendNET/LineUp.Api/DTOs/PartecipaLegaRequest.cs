using System.ComponentModel.DataAnnotations;

namespace LineUp.Api.DTOs;

public class PartecipaLegaRequest
{
    [Required(ErrorMessage = "Il codice di invito è obbligatorio")]
    [RegularExpression(@"^[A-Za-z0-9]{6,8}$", ErrorMessage = "Il codice deve essere di 6 o 8 caratteri alfanumerici")]
    public string CodiceLega { get; set; } = string.Empty;
}
