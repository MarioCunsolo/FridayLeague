using System.ComponentModel.DataAnnotations;

namespace LineUp.Api.DTOs;

public class CambiaPasswordRequest
{
    [Required(ErrorMessage = "La password è obbligatoria.")]
    [MinLength(6, ErrorMessage = "La password deve contenere almeno 6 caratteri.")]
    public string Password { get; set; } = string.Empty;
}
