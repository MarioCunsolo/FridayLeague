namespace LineUp.Api.Services;

public interface IAuthorizationHelper
{
    Task<bool> IsAdminOrCoAdminAsync(Guid userId, Guid legaId);
}
