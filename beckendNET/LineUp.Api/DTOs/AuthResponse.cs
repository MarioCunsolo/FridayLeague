namespace LineUp.Api.DTOs;

public class AuthResponse
{
    public UserDto User { get; set; } = null!;
    public string Token { get; set; } = string.Empty;
}
