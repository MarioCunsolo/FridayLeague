using System.ComponentModel.DataAnnotations;

namespace FridayLeague.Api.DTOs;

public class AggiornaProfiloRequest
{
    [Required(ErrorMessage = "Il nome è obbligatorio.")]
    public string Nome { get; set; } = string.Empty;

    [Required(ErrorMessage = "Il cognome è obbligatorio.")]
    public string Cognome { get; set; } = string.Empty;

    [Required(ErrorMessage = "L'email è obbligatoria.")]
    [EmailAddress(ErrorMessage = "L'indirizzo email non è valido.")]
    public string Email { get; set; } = string.Empty;

    public string? Password { get; set; }
}
