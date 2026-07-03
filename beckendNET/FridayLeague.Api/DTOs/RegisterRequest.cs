using System.ComponentModel.DataAnnotations;

namespace FridayLeague.Api.DTOs;

public class RegisterRequest
{
    [Required(ErrorMessage = "Il nome è obbligatorio")]
    public string Nome { get; set; } = string.Empty;

    [Required(ErrorMessage = "Il cognome è obbligatorio")]
    public string Cognome { get; set; } = string.Empty;

    [Required(ErrorMessage = "L'email è obbligatoria")]
    [EmailAddress(ErrorMessage = "Formato email non valido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La password è obbligatoria")]
    [MinLength(6, ErrorMessage = "La password deve contenere almeno 6 caratteri")]
    public string Password { get; set; } = string.Empty;
}
