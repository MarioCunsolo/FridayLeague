namespace FridayLeague.Api.Services;

public interface IAuthorizationHelper
{
    Task<bool> IsAdminOrCoAdminAsync(int userId, int legaId);
}
