using LineUp.Api.Data;
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

    public async Task<PlayerProfileDto> GetPlayerProfileAsync(Guid userId, Guid playerId, string? season)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        _ = await _proxy.GetMembroAsync(legaId, playerId)
            ?? throw new NotFoundException("Giocatore non trovato nella lega.");

        var selectedSeason = season ?? DateTime.UtcNow.Year.ToString();
        var membri = await _proxy.GetMembriAsync(legaId);
        var partite = await _proxy.GetPartiteAsync(legaId);
        var partecipazioni = await _proxy.GetPartecipazioniAsync(legaId, selectedSeason);
        var gol = await _proxy.GetGolLegaAsync(legaId, selectedSeason);

        // Il profilo considera soltanto partite effettivamente concluse: una formazione
        // impostata per una gara futura non equivale a una presenza giocata.
        var partiteConcluse = partite
            .Where(p => p.Stagione == selectedSeason && p.StatoId == StatoPartita.ConclusaId)
            .ToList();
        var partiteConcluseIds = partiteConcluse.Select(p => p.Id).ToHashSet();
        var partecipazioniConcluse = partecipazioni
            .Where(p => partiteConcluseIds.Contains(p.PartitaId))
            .ToList();
        var golConcluse = gol
            .Where(g => partiteConcluseIds.Contains(g.PartitaId))
            .ToList();

        int GoalsOf(Guid id) => golConcluse.Count(g => g.MarcatoreUserId == id);
        int AssistsOf(Guid id) => golConcluse.Count(g => g.AssistUserId == id);
        int MotmOf(Guid id) => partecipazioniConcluse.Count(p => p.UserId == id && p.Motm);
        int PartiteOf(Guid id) => partecipazioniConcluse.Count(p => p.UserId == id);
        int RankOf(Func<Guid, int> selector) => membri
            .Select(member => selector(member.Id))
            .OrderByDescending(value => value)
            .ToList()
            .IndexOf(selector(playerId)) + 1;

        var playerParticipations = partecipazioniConcluse
            .Where(p => p.UserId == playerId)
            .OrderByDescending(p => p.Partita.DataOra)
            .ToList();

        PlayerMatchSummaryDto MappaPartita(PartecipantePartita participation) => new()
        {
            Id = participation.PartitaId,
            Date = participation.Partita.DataOra,
            HomeTeam = participation.Partita.SquadraCasa.Nome,
            AwayTeam = participation.Partita.SquadraTrasferta.Nome,
            HomeScore = participation.Partita.GolCasa,
            AwayScore = participation.Partita.GolTrasferta,
            PlayerTeam = participation.InCasa
                ? participation.Partita.SquadraCasa.Nome
                : participation.Partita.SquadraTrasferta.Nome,
            Goals = golConcluse.Count(g => g.PartitaId == participation.PartitaId && g.MarcatoreUserId == playerId),
            Assists = golConcluse.Count(g => g.PartitaId == participation.PartitaId && g.AssistUserId == playerId),
            IsMotm = participation.Motm
        };

        var recentMatches = playerParticipations.Take(5).Select(MappaPartita).ToList();
        var performance = playerParticipations
            .Take(6)
            .Select(MappaPartita)
            .OrderBy(match => match.Date)
            .Select(match => new PlayerPerformancePointDto
            {
                MatchId = match.Id,
                Date = match.Date,
                Goals = match.Goals,
                Assists = match.Assists
            })
            .ToList();

        var nextMatch = await _proxy.GetProssimaPartitaAsync(legaId);
        var reservation = nextMatch is null
            ? null
            : await _proxy.GetPrenotazioneAsync(nextMatch.Id, playerId);
        var matchesPlayed = PartiteOf(playerId);
        var goals = GoalsOf(playerId);
        var assists = AssistsOf(playerId);
        var motm = MotmOf(playerId);

        return new PlayerProfileDto
        {
            Season = selectedSeason,
            Summary = new PlayerProfileSummaryDto
            {
                Goals = goals,
                Assists = assists,
                Motm = motm,
                MatchesPlayed = matchesPlayed,
                TotalLeagueMatches = partiteConcluse.Count,
                GoalRank = RankOf(GoalsOf),
                AssistRank = RankOf(AssistsOf),
                MotmRank = RankOf(MotmOf),
                GoalsPerMatch = DivideAndRound(goals, matchesPlayed),
                AssistsPerMatch = DivideAndRound(assists, matchesPlayed),
                ParticipationRate = DivideAndRound(matchesPlayed * 100, partiteConcluse.Count),
                LeagueAverageGoals = DivideAndRound(golConcluse.Count, membri.Count),
                LeagueAverageAssists = DivideAndRound(golConcluse.Count(g => g.AssistUserId.HasValue), membri.Count)
            },
            Stats = new List<UserStatsDto>
            {
                new() { Label = "GOAL", Value = goals, Icon = "fa-futbol-o", ColorClass = "text-success", Rank = RankOf(GoalsOf) },
                new() { Label = "ASSIST", Value = assists, Icon = "fa-handshake-o", ColorClass = "text-success", Rank = RankOf(AssistsOf) },
                new() { Label = "MOTM", Value = motm, Icon = "fa-trophy", ColorClass = "text-success", Rank = RankOf(MotmOf) },
                new() { Label = "PARTITE", Value = matchesPlayed, Icon = "fa-line-chart", ColorClass = "text-success" }
            },
            RecentMatches = recentMatches,
            Performance = performance,
            NextMatch = nextMatch is null ? null : new NextMatchReservationDto
            {
                Id = nextMatch.Id,
                Date = nextMatch.DataOra,
                HomeTeam = nextMatch.SquadraCasa.Nome,
                AwayTeam = nextMatch.SquadraTrasferta.Nome,
                IsReserved = reservation is not null
            }
        };
    }

    private static decimal DivideAndRound(int numerator, int denominator) =>
        denominator == 0 ? 0 : Math.Round((decimal)numerator / denominator, 1);

    private async Task<Guid> GetLegaAttivaAsync(Guid userId) =>
        await _proxy.GetActiveLegaIdAsync(userId) ?? throw new BadRequestException("Nessuna lega attiva selezionata.");
}
