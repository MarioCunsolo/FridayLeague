using FridayLeague.Api.Data;

namespace FridayLeague.Api.Services;

public interface ITokenService
{
    string CreateToken(User user);
}
