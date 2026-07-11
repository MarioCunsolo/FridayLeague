using LineUp.Api.Data;

namespace LineUp.Api.Services;

public interface ITokenService
{
    string CreateToken(User user);
}
