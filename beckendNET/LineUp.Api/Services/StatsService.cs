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
        var membri = await _proxy.GetMembriAsync(legaId);
        var gol = await _proxy.GetGolLegaAsync(legaId, season);
        var partecipazioni = await _proxy.GetPartecipazioniAsync(legaId, season);

        return CostruisciClassifica(membri, gol.GroupBy(g => g.MarcatoreUserId), partecipazioni);
    }

    public async Task<List<PlayerStatsDto>> GetAssistsAsync(Guid userId, string? season)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        var membri = await _proxy.GetMembriAsync(legaId);
        var gol = await _proxy.GetGolLegaAsync(legaId, season);
        var partecipazioni = await _proxy.GetPartecipazioniAsync(legaId, season);

        var raggruppati = gol
            .Where(g => g.AssistUserId.HasValue)
            .GroupBy(g => g.AssistUserId!.Value);

        return CostruisciClassifica(membri, raggruppati, partecipazioni);
    }

    public async Task<List<PlayerStatsDto>> GetMotmAsync(Guid userId, string? season)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        var membri = await _proxy.GetMembriAsync(legaId);
        var partecipazioni = await _proxy.GetPartecipazioniAsync(legaId, season);

        var raggruppati = partecipazioni
            .Where(p => p.Motm)
            .GroupBy(p => p.UserId);

        return CostruisciClassifica(membri, raggruppati, partecipazioni);
    }

    private static List<PlayerStatsDto> CostruisciClassifica(
        List<User> membri,
        IEnumerable<IGrouping<Guid, EventoGol>> raggruppati,
        List<PartecipantePartita> partecipazioni)
    {
        var valori = raggruppati.ToDictionary(g => g.Key, g => g.Count());
        return CostruisciClassifica(membri, valori, partecipazioni);
    }

    private static List<PlayerStatsDto> CostruisciClassifica(
        List<User> membri,
        IEnumerable<IGrouping<Guid, PartecipantePartita>> raggruppati,
        List<PartecipantePartita> partecipazioni)
    {
        var valori = raggruppati.ToDictionary(g => g.Key, g => g.Count());
        return CostruisciClassifica(membri, valori, partecipazioni);
    }

    private static List<PlayerStatsDto> CostruisciClassifica(
        List<User> membri,
        IReadOnlyDictionary<Guid, int> valori,
        List<PartecipantePartita> partecipazioni)
    {
        return membri
            .Select(membro => Costruisci(membro, valori.GetValueOrDefault(membro.Id), partecipazioni))
            .OrderByDescending(dto => dto.Value)
            .ThenBy(dto => dto.Name)
            .ToList();
    }

    private static PlayerStatsDto Costruisci(User membro, int value, List<PartecipantePartita> partecipazioni)
    {
        // La squadra mostrata è quella dell'ultima partita giocata nel periodo filtrato.
        // Chi non ha ancora partecipato compare comunque con una squadra vuota e valore zero.
        var ultimaPartecipazione = partecipazioni
            .Where(p => p.UserId == membro.Id)
            .OrderByDescending(p => p.Partita.DataOra)
            .FirstOrDefault();

        var squadra = ultimaPartecipazione is null
            ? string.Empty
            : ultimaPartecipazione.InCasa
                ? ultimaPartecipazione.Partita.SquadraCasa.Nome
                : ultimaPartecipazione.Partita.SquadraTrasferta.Nome;

        return new PlayerStatsDto
        {
            Name = $"{membro.Nome} {membro.Cognome}",
            Team = squadra,
            Value = value,
            Avatar = PlayerDisplayExtensions.GetInitials(membro.Nome, membro.Cognome),
            Color = PlayerDisplayExtensions.GetAvatarColor(membro.Id.ToString())
        };
    }

    private async Task<Guid> GetLegaAttivaAsync(Guid userId) =>
        await _proxy.GetActiveLegaIdAsync(userId) ?? throw new BadRequestException("Nessuna lega attiva selezionata.");
}
