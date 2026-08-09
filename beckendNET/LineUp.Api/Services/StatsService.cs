using LineUp.Api.Data;
using LineUp.Api.DTOs;
using LineUp.Api.Extensions;
using LineUp.Api.Proxies;

namespace LineUp.Api.Services;

public class StatsService : IStatsService
{
    private readonly IStatsProxy _proxy;

    public StatsService(IStatsProxy proxy)
    {
        _proxy = proxy;
    }

    public async Task<List<PlayerStatsDto>> GetScorersAsync(Guid userId, string? season)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        var gol = await _proxy.GetGolLegaAsync(legaId, season);
        var partecipazioni = await _proxy.GetPartecipazioniAsync(legaId, season);

        return CostruisciClassifica(gol.GroupBy(g => g.MarcatoreUserId), partecipazioni);
    }

    public async Task<List<PlayerStatsDto>> GetAssistsAsync(Guid userId, string? season)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        var gol = await _proxy.GetGolLegaAsync(legaId, season);
        var partecipazioni = await _proxy.GetPartecipazioniAsync(legaId, season);

        var raggruppati = gol
            .Where(g => g.AssistUserId.HasValue)
            .GroupBy(g => g.AssistUserId!.Value);

        return CostruisciClassifica(raggruppati, partecipazioni);
    }

    public async Task<List<PlayerStatsDto>> GetMotmAsync(Guid userId, string? season)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        var partecipazioni = await _proxy.GetPartecipazioniAsync(legaId, season);

        var raggruppati = partecipazioni
            .Where(p => p.Motm)
            .GroupBy(p => p.UserId);

        return CostruisciClassifica(raggruppati, partecipazioni);
    }

    private static List<PlayerStatsDto> CostruisciClassifica(IEnumerable<IGrouping<Guid, EventoGol>> raggruppati, List<PartecipantePartita> partecipazioni)
    {
        return raggruppati
            .Select(g => Costruisci(g.Key, g.Count(), partecipazioni))
            .Where(dto => dto != null)
            .OrderByDescending(dto => dto!.Value)
            .Select(dto => dto!)
            .ToList();
    }

    private static List<PlayerStatsDto> CostruisciClassifica(IEnumerable<IGrouping<Guid, PartecipantePartita>> raggruppati, List<PartecipantePartita> partecipazioni)
    {
        return raggruppati
            .Select(g => Costruisci(g.Key, g.Count(), partecipazioni))
            .Where(dto => dto != null)
            .OrderByDescending(dto => dto!.Value)
            .Select(dto => dto!)
            .ToList();
    }

    private static PlayerStatsDto? Costruisci(Guid userId, int value, List<PartecipantePartita> partecipazioni)
    {
        // La squadra mostrata è quella dell'ultima partita giocata nel periodo filtrato (un giocatore può cambiare squadra ogni partita)
        var ultimaPartecipazione = partecipazioni
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.Partita.DataOra)
            .FirstOrDefault();

        if (ultimaPartecipazione == null) return null;

        var user = ultimaPartecipazione.User;
        var squadra = ultimaPartecipazione.InCasa
            ? ultimaPartecipazione.Partita.SquadraCasa.Nome
            : ultimaPartecipazione.Partita.SquadraTrasferta.Nome;

        return new PlayerStatsDto
        {
            Name = $"{user.Nome} {user.Cognome}",
            Team = squadra,
            Value = value,
            Avatar = PlayerDisplayExtensions.GetInitials(user.Nome, user.Cognome),
            Color = PlayerDisplayExtensions.GetAvatarColor(user.Id.ToString())
        };
    }

    private async Task<Guid> GetLegaAttivaAsync(Guid userId) =>
        await _proxy.GetActiveLegaIdAsync(userId) ?? throw new BadRequestException("Nessuna lega attiva selezionata.");
}
