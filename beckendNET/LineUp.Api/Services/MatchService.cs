using LineUp.Api.Data;
using LineUp.Api.DTOs;
using LineUp.Api.Proxies;

namespace LineUp.Api.Services;

public class MatchService : IMatchService
{
    private static readonly string[] StatiValidi = { StatoPartita.Programmata, StatoPartita.InCorso, StatoPartita.Terminata };

    private readonly IMatchProxy _proxy;
    private readonly IAuthorizationHelper _authorizationHelper;

    public MatchService(IMatchProxy proxy, IAuthorizationHelper authorizationHelper)
    {
        _proxy = proxy;
        _authorizationHelper = authorizationHelper;
    }

    public async Task<List<MatchDto>> GetMatchesAsync(int userId)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        var partite = await _proxy.GetPartiteAsync(legaId);

        var risultato = new List<MatchDto>();
        foreach (var partita in partite)
        {
            risultato.Add(await BuildMatchDtoAsync(partita));
        }
        return risultato;
    }

    public async Task<MatchDto> CreateMatchAsync(int userId, CreateMatchRequest request)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        await RichiediAdminAsync(userId, legaId);

        if (string.IsNullOrWhiteSpace(request.HomeTeam) || string.IsNullOrWhiteSpace(request.AwayTeam))
        {
            throw new BadRequestException("Le squadre casa e trasferta sono obbligatorie.");
        }

        var stato = ValidaStato(request.Status ?? StatoPartita.Programmata);

        var squadraCasa = await _proxy.GetOrCreateSquadraAsync(legaId, request.HomeTeam);
        var squadraTrasferta = await _proxy.GetOrCreateSquadraAsync(legaId, request.AwayTeam);

        var partita = new Partita
        {
            LegaId = legaId,
            SquadraCasaId = squadraCasa.Id,
            SquadraTrasfertaId = squadraTrasferta.Id,
            DataOra = request.Date,
            Stato = stato,
            Stagione = request.Date.Year.ToString()
        };

        await _proxy.CreatePartitaAsync(partita);
        return await BuildMatchDtoAsync(partita);
    }

    public async Task<MatchDto> UpdateMatchAsync(int userId, int matchId, UpdateMatchRequest request)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        await RichiediAdminAsync(userId, legaId);

        var partita = await GetPartitaDellaLegaAsync(matchId, legaId);

        if (!string.IsNullOrWhiteSpace(request.HomeTeam))
        {
            var squadra = await _proxy.GetOrCreateSquadraAsync(legaId, request.HomeTeam);
            partita.SquadraCasaId = squadra.Id;
        }

        if (!string.IsNullOrWhiteSpace(request.AwayTeam))
        {
            var squadra = await _proxy.GetOrCreateSquadraAsync(legaId, request.AwayTeam);
            partita.SquadraTrasfertaId = squadra.Id;
        }

        if (request.HomeScore.HasValue) partita.GolCasa = request.HomeScore.Value;
        if (request.AwayScore.HasValue) partita.GolTrasferta = request.AwayScore.Value;
        if (request.Date.HasValue) partita.DataOra = request.Date.Value;
        if (!string.IsNullOrWhiteSpace(request.Status)) partita.Stato = ValidaStato(request.Status);

        await _proxy.SalvaPartitaAsync();
        return await BuildMatchDtoAsync(partita);
    }

    public async Task DeleteMatchAsync(int userId, int matchId)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        await RichiediAdminAsync(userId, legaId);

        var partita = await GetPartitaDellaLegaAsync(matchId, legaId);
        await _proxy.DeletePartitaAsync(partita);
    }

    public async Task<GoalEventDto> AddGoalAsync(int userId, int matchId, AddGoalRequest request)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        var partita = await GetPartitaDellaLegaAsync(matchId, legaId);

        if (string.IsNullOrWhiteSpace(request.ScorerName))
        {
            throw new BadRequestException("Il nome del marcatore è obbligatorio.");
        }

        var marcatore = await RisolviOCreaPartecipanteAsync(partita, request.ScorerName, request.IsHome);

        PartecipantePartita? assist = null;
        if (!string.IsNullOrWhiteSpace(request.AssistName))
        {
            // L'assist si assume sempre della stessa squadra del marcatore (regola di dominio: un assist è sempre di un compagno)
            assist = await RisolviOCreaPartecipanteAsync(partita, request.AssistName, request.IsHome);
        }

        var evento = new EventoGol
        {
            PartitaId = partita.Id,
            MarcatoreUserId = marcatore.UserId,
            InCasa = request.IsHome,
            AssistUserId = assist?.UserId
        };
        await _proxy.AddGoalAsync(evento);

        if (request.IsHome) partita.GolCasa++; else partita.GolTrasferta++;
        if (partita.Stato == StatoPartita.Programmata) partita.Stato = StatoPartita.InCorso;
        await _proxy.SalvaPartitaAsync();

        return new GoalEventDto
        {
            ScorerName = request.ScorerName,
            IsHome = request.IsHome,
            AssistName = request.AssistName
        };
    }

    public async Task SetMotmAsync(int userId, int matchId, SetMotmRequest request)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        await RichiediAdminAsync(userId, legaId);

        var partita = await GetPartitaDellaLegaAsync(matchId, legaId);

        var eletto = await _proxy.FindPartecipanteByNomeAsync(matchId, request.PlayerName, request.IsHome)
            ?? throw new NotFoundException($"Nessun partecipante trovato con il nome '{request.PlayerName}' in questa partita.");

        var tuttiIPartecipanti = await _proxy.GetPartecipantiAsync(matchId);
        foreach (var p in tuttiIPartecipanti)
        {
            p.Motm = p.Id == eletto.Id;
        }
        await _proxy.SalvaPartecipantiAsync();
    }

    private async Task<PartecipantePartita> RisolviOCreaPartecipanteAsync(Partita partita, string nome, bool isHome)
    {
        var esistente = await _proxy.FindPartecipanteByNomeAsync(partita.Id, nome, isHome);
        if (esistente != null) return esistente;

        var membro = await _proxy.FindMembroByNomeCompletoAsync(partita.LegaId, nome)
            ?? throw new NotFoundException($"Nessun membro della lega trovato con il nome '{nome}'.");

        var nuovo = new PartecipantePartita { PartitaId = partita.Id, UserId = membro.Id, InCasa = isHome };
        await _proxy.AddPartecipantiAsync(new[] { nuovo });
        return nuovo;
    }

    private async Task<MatchDto> BuildMatchDtoAsync(Partita partita)
    {
        var partecipanti = await _proxy.GetPartecipantiAsync(partita.Id);
        var gol = await _proxy.GetGolAsync(partita.Id);

        MatchPlayerDto MappaGiocatore(PartecipantePartita p) => new()
        {
            Name = $"{p.User.Nome} {p.User.Cognome}",
            Goals = gol.Count(g => g.MarcatoreUserId == p.UserId),
            Assists = gol.Count(g => g.AssistUserId == p.UserId)
        };

        return new MatchDto
        {
            Id = partita.Id,
            HomeTeam = partita.SquadraCasa.Nome,
            AwayTeam = partita.SquadraTrasferta.Nome,
            HomeScore = partita.GolCasa,
            AwayScore = partita.GolTrasferta,
            Status = partita.Stato,
            Date = partita.DataOra,
            HomePlayers = partecipanti.Where(p => p.InCasa).Select(MappaGiocatore).ToList(),
            AwayPlayers = partecipanti.Where(p => !p.InCasa).Select(MappaGiocatore).ToList(),
            GoalTimeline = gol.Select(g => new GoalEventDto
            {
                ScorerName = $"{g.Marcatore.Nome} {g.Marcatore.Cognome}",
                IsHome = g.InCasa,
                AssistName = g.Assist != null ? $"{g.Assist.Nome} {g.Assist.Cognome}" : null
            }).ToList()
        };
    }

    private async Task<int> GetLegaAttivaAsync(int userId) =>
        await _proxy.GetActiveLegaIdAsync(userId) ?? throw new BadRequestException("Nessuna lega attiva selezionata.");

    private async Task RichiediAdminAsync(int userId, int legaId)
    {
        if (!await _authorizationHelper.IsAdminOrCoAdminAsync(userId, legaId))
        {
            throw new ForbiddenException("Solo admin o co-admin possono gestire le partite.");
        }
    }

    private async Task<Partita> GetPartitaDellaLegaAsync(int matchId, int legaId)
    {
        var partita = await _proxy.GetPartitaAsync(matchId)
            ?? throw new NotFoundException("Partita non trovata.");

        if (partita.LegaId != legaId)
        {
            throw new NotFoundException("Partita non trovata.");
        }

        return partita;
    }

    private static string ValidaStato(string stato)
    {
        if (!StatiValidi.Contains(stato))
        {
            throw new BadRequestException($"Stato non valido. Deve essere uno tra: {string.Join(", ", StatiValidi)}.");
        }
        return stato;
    }
}
