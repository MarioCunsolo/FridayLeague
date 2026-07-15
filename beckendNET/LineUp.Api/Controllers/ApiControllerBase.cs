using LineUp.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace LineUp.Api.Controllers;

// Centralizza la traduzione delle eccezioni di dominio (lanciate dai Service) in risposte HTTP,
// evitando di ripetere lo stesso try/catch in ogni azione di ogni controller.
public abstract class ApiControllerBase : ControllerBase
{
    protected async Task<ActionResult<T>> ExecuteAsync<T>(Func<Task<T>> action)
    {
        try
        {
            return Ok(await action());
        }
        catch (NotFoundException ex) { return NotFound(ex.Message); }
        catch (ForbiddenException ex) { return StatusCode(403, ex.Message); }
        catch (BadRequestException ex) { return BadRequest(ex.Message); }
    }

    protected async Task<IActionResult> ExecuteAsync(Func<Task> action)
    {
        try
        {
            await action();
            return Ok();
        }
        catch (NotFoundException ex) { return NotFound(ex.Message); }
        catch (ForbiddenException ex) { return StatusCode(403, ex.Message); }
        catch (BadRequestException ex) { return BadRequest(ex.Message); }
    }
}
