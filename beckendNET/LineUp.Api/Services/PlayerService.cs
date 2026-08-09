using LineUp.Api.DTOs;
using LineUp.Api.Proxies;

namespace LineUp.Api.Services;

public class PlayerService : IPlayerService
{
    private readonly IPlayerProxy _proxy;

    public PlayerService(IPlayerProxy proxy)
    {
        _proxy = proxy;
    }

    public async Task<List<PlayerDto>> GetPlayersAsync(Guid userId)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        var membri = await _proxy.GetMembriAsync(legaId);
        var gol = await _proxy.GetGolLegaAsync(legaId, null);

        return membri.Select(m => new PlayerDto
        {
            Id = m.Id,
            Name = $"{m.Nome} {m.Cognome}",
            Goals = gol.Count(g => g.MarcatoreUserId == m.Id),
            Assists = gol.Count(g => g.AssistUserId == m.Id)
        }).ToList();
    }

    public async Task<PlayerDto> GetPlayerByIdAsync(Guid userId, Guid playerId)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        var membro = await _proxy.GetMembroAsync(legaId, playerId)
            ?? throw new NotFoundException("Giocatore non trovato nella lega.");
        var gol = await _proxy.GetGolLegaAsync(legaId, null);

        return new PlayerDto
        {
            Id = membro.Id,
            Name = $"{membro.Nome} {membro.Cognome}",
            Goals = gol.Count(g => g.MarcatoreUserId == membro.Id),
            Assists = gol.Count(g => g.AssistUserId == membro.Id)
        };
    }

    public async Task<List<UserStatsDto>> GetPlayerStatsAsync(Guid userId, Guid playerId, string? season)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        _ = await _proxy.GetMembroAsync(legaId, playerId)
            ?? throw new NotFoundException("Giocatore non trovato nella lega.");

        var membri = await _proxy.GetMembriAsync(legaId);
        var partecipazioni = await _proxy.GetPartecipazioniAsync(legaId, season);
        var gol = await _proxy.GetGolLegaAsync(legaId, season);

        int GoalsOf(Guid uid) => gol.Count(g => g.MarcatoreUserId == uid);
        int AssistsOf(Guid uid) => gol.Count(g => g.AssistUserId == uid);
        int MotmOf(Guid uid) => partecipazioni.Count(p => p.UserId == uid && p.Motm);
        int PartiteOf(Guid uid) => partecipazioni.Count(p => p.UserId == uid);

        // Ranking "1224": la posizione riflette il valore nella classifica della lega, a parità di valore stesso rank.
        int RankOf(Func<Guid, int> selettore)
        {
            var valoriOrdinati = membri.Select(m => selettore(m.Id)).OrderByDescending(v => v).ToList();
            return valoriOrdinati.IndexOf(selettore(playerId)) + 1;
        }

        return new List<UserStatsDto>
        {
            new() { Label = "GOAL", Value = GoalsOf(playerId), Icon = "fa-futbol-o", ColorClass = "text-success", Rank = RankOf(GoalsOf) },
            new() { Label = "ASSIST", Value = AssistsOf(playerId), Icon = "fa-handshake-o", ColorClass = "text-success", Rank = RankOf(AssistsOf) },
            new() { Label = "MOTM", Value = MotmOf(playerId), Icon = "fa-trophy", ColorClass = "text-success", Rank = RankOf(MotmOf) },
            new() { Label = "PARTITE", Value = PartiteOf(playerId), Icon = "fa-line-chart", ColorClass = "text-success" }
        };
    }

    private async Task<Guid> GetLegaAttivaAsync(Guid userId) =>
        await _proxy.GetActiveLegaIdAsync(userId) ?? throw new BadRequestException("Nessuna lega attiva selezionata.");
}
