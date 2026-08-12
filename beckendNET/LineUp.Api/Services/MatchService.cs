using LineUp.Api.Data;
using LineUp.Api.DTOs;
using LineUp.Api.Proxies;

namespace LineUp.Api.Services;

public class MatchService : IMatchService
{
    private static readonly string[] StatiValidi = { StatoPartita.Programmata, StatoPartita.InCorso, StatoPartita.Conclusa, StatoPartita.Annullata };

    // Una partita si considera conclusa 2 ore dopo il suo orario di inizio, indipendentemente
    // dal fatto che qualcuno abbia registrato gol o aggiornato manualmente lo stato.
    private static readonly TimeSpan DurataPartita = TimeSpan.FromHours(2);

    private readonly IMatchProxy _proxy;
    private readonly IAuthorizationHelper _authorizationHelper;

    public MatchService(IMatchProxy proxy, IAuthorizationHelper authorizationHelper)
    {
        _proxy = proxy;
        _authorizationHelper = authorizationHelper;
    }

    public async Task<List<MatchDto>> GetMatchesAsync(Guid userId)
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

    public async Task<MatchDto> CreateMatchAsync(Guid userId, CreateMatchRequest request)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        await RichiediAdminAsync(userId, legaId);

        if (string.IsNullOrWhiteSpace(request.HomeTeam) || string.IsNullOrWhiteSpace(request.AwayTeam))
        {
            throw new BadRequestException("Le squadre casa e trasferta sono obbligatorie.");
        }

        var statoId = ValidaStatoId(request.Status ?? StatoPartita.Programmata);

        var squadraCasa = await _proxy.GetOrCreateSquadraAsync(legaId, request.HomeTeam);
        var squadraTrasferta = await _proxy.GetOrCreateSquadraAsync(legaId, request.AwayTeam);

        var partita = new Partita
        {
            LegaId = legaId,
            SquadraCasaId = squadraCasa.Id,
            SquadraTrasfertaId = squadraTrasferta.Id,
            DataOra = request.Date,
            StatoId = statoId,
            Stagione = request.Date.Year.ToString()
        };

        await _proxy.CreatePartitaAsync(partita);
        return await BuildMatchDtoAsync(partita);
    }

    public async Task<MatchDto> UpdateMatchAsync(Guid userId, int matchId, UpdateMatchRequest request)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        await RichiediAdminAsync(userId, legaId);

        var partita = await GetPartitaDellaLegaAsync(matchId, legaId);
        if (partita.StatoId != StatoPartita.ProgrammataId || partita.DataOra <= DateTime.UtcNow)
        {
            throw new BadRequestException("Puoi modificare solo una partita futura ancora programmata.");
        }

        if (string.IsNullOrWhiteSpace(request.HomeTeam) || string.IsNullOrWhiteSpace(request.AwayTeam))
        {
            throw new BadRequestException("Le squadre casa e trasferta sono obbligatorie.");
        }

        if (request.HomeTeam.Trim().Equals(request.AwayTeam.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            throw new BadRequestException("Le squadre casa e trasferta devono essere diverse.");
        }

        if (request.Date <= DateTime.UtcNow)
        {
            throw new BadRequestException("La data della partita deve essere futura.");
        }

        // La modifica comprende esclusivamente i campi esposti nella modale: squadre e data/ora.
        var squadraCasa = await _proxy.GetOrCreateSquadraAsync(legaId, request.HomeTeam);
        var squadraTrasferta = await _proxy.GetOrCreateSquadraAsync(legaId, request.AwayTeam);
        partita.SquadraCasaId = squadraCasa.Id;
        partita.SquadraTrasfertaId = squadraTrasferta.Id;
        partita.DataOra = request.Date;
        partita.Stagione = request.Date.Year.ToString();

        await _proxy.SalvaPartitaAsync();
        return await BuildMatchDtoAsync(partita);
    }

    public async Task DeleteMatchAsync(Guid userId, int matchId)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        await RichiediAdminAsync(userId, legaId);

        var partita = await GetPartitaDellaLegaAsync(matchId, legaId);

        if (partita.DataOra <= DateTime.UtcNow)
        {
            throw new BadRequestException("Non è possibile eliminare una partita già disputata o in corso.");
        }

        await _proxy.DeletePartitaAsync(partita);
    }

    public async Task<MatchDto> AnnullaMatchAsync(Guid userId, int matchId)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        await RichiediAdminAsync(userId, legaId);

        var partita = await GetPartitaDellaLegaAsync(matchId, legaId);

        if (partita.StatoId != StatoPartita.InCorsoId && partita.StatoId != StatoPartita.ProgrammataId)
        {
            throw new BadRequestException("Puoi annullare solo una partita programmata o in corso.");
        }

        partita.StatoId = StatoPartita.AnnullataId;
        await _proxy.SalvaPartitaAsync();

        return await BuildMatchDtoAsync(partita);
    }

    public async Task<MatchDto> IniziaMatchAsync(Guid userId, int matchId)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        await RichiediAdminAsync(userId, legaId);

        var partita = await GetPartitaDellaLegaAsync(matchId, legaId);

        if (partita.StatoId != StatoPartita.ProgrammataId)
        {
            throw new BadRequestException("Puoi iniziare solo una partita nello stato in programma.");
        }

        partita.StatoId = StatoPartita.InCorsoId;
        await _proxy.SalvaPartitaAsync();

        return await BuildMatchDtoAsync(partita);
    }

    public async Task<MatchDto> ConcludiMatchAsync(Guid userId, int matchId)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        await RichiediAdminAsync(userId, legaId);

        var partita = await GetPartitaDellaLegaAsync(matchId, legaId);

        if (partita.StatoId != StatoPartita.InCorsoId)
        {
            throw new BadRequestException("Puoi concludere solo una partita attualmente in corso.");
        }

        partita.StatoId = StatoPartita.ConclusaId;
        await _proxy.SalvaPartitaAsync();

        return await BuildMatchDtoAsync(partita);
    }

    public async Task<GoalEventDto> AddGoalAsync(Guid userId, int matchId, AddGoalRequest request)
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
        if (partita.StatoId == StatoPartita.ProgrammataId) partita.StatoId = StatoPartita.InCorsoId;
        await _proxy.SalvaPartitaAsync();

        return new GoalEventDto
        {
            ScorerName = request.ScorerName,
            IsHome = request.IsHome,
            AssistName = request.AssistName
        };
    }

    public async Task SetMotmAsync(Guid userId, int matchId, SetMotmRequest request)
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

    public async Task<MatchDto> SetupLineupAsync(Guid userId, int matchId, SetupMatchLineupRequest request)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        await RichiediAdminAsync(userId, legaId);

        var partita = await GetPartitaDellaLegaAsync(matchId, legaId);

        if (partita.StatoId != StatoPartita.ProgrammataId)
        {
            throw new BadRequestException("È possibile impostare la formazione solo per le partite in programma.");
        }

        var nuoviPartecipanti = new List<PartecipantePartita>();

        if (request.HomePlayerNames != null)
        {
            foreach (var nome in request.HomePlayerNames)
            {
                if (string.IsNullOrWhiteSpace(nome)) continue;
                var membro = await _proxy.FindMembroByNomeCompletoAsync(legaId, nome);
                if (membro != null)
                {
                    nuoviPartecipanti.Add(new PartecipantePartita
                    {
                        PartitaId = partita.Id,
                        UserId = membro.Id,
                        InCasa = true
                    });
                }
            }
        }

        if (request.AwayPlayerNames != null)
        {
            foreach (var nome in request.AwayPlayerNames)
            {
                if (string.IsNullOrWhiteSpace(nome)) continue;
                var membro = await _proxy.FindMembroByNomeCompletoAsync(legaId, nome);
                if (membro != null)
                {
                    nuoviPartecipanti.Add(new PartecipantePartita
                    {
                        PartitaId = partita.Id,
                        UserId = membro.Id,
                        InCasa = false
                    });
                }
            }
        }

        await _proxy.ReplacePartecipantiAsync(partita.Id, nuoviPartecipanti);
        return await BuildMatchDtoAsync(partita);
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
            Status = CalcolaStatoEffettivo(partita),
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

    private async Task<Guid> GetLegaAttivaAsync(Guid userId) =>
        await _proxy.GetActiveLegaIdAsync(userId) ?? throw new BadRequestException("Nessuna lega attiva selezionata.");

    private async Task RichiediAdminAsync(Guid userId, Guid legaId)
    {
        if (!await _authorizationHelper.IsAdminOrCoAdminAsync(userId, legaId))
        {
            throw new ForbiddenException("Solo admin o co-admin possono gestire le partite.");
        }
    }

    private async Task<Partita> GetPartitaDellaLegaAsync(int matchId, Guid legaId)
    {
        var partita = await _proxy.GetPartitaAsync(matchId)
            ?? throw new NotFoundException("Partita non trovata.");

        if (partita.LegaId != legaId)
        {
            throw new NotFoundException("Partita non trovata.");
        }

        return partita;
    }

    private static int ValidaStatoId(string stato) => stato?.Trim() switch
    {
        StatoPartita.Programmata => StatoPartita.ProgrammataId,
        StatoPartita.InCorso => StatoPartita.InCorsoId,
        StatoPartita.Conclusa => StatoPartita.ConclusaId,
        StatoPartita.Annullata => StatoPartita.AnnullataId,
        _ => throw new BadRequestException($"Stato non valido. Deve essere uno tra: {string.Join(", ", StatiValidi)}.")
    };

    private static string CalcolaStatoEffettivo(Partita partita)
    {
        if (partita.StatoId == StatoPartita.ConclusaId) return StatoPartita.Conclusa;
        if (partita.StatoId == StatoPartita.AnnullataId) return StatoPartita.Annullata;

        if (partita.DataOra + DurataPartita <= DateTime.UtcNow)
        {
            return StatoPartita.Conclusa;
        }

        return partita.StatoId switch
        {
            StatoPartita.InCorsoId => StatoPartita.InCorso,
            StatoPartita.ConclusaId => StatoPartita.Conclusa,
            StatoPartita.AnnullataId => StatoPartita.Annullata,
            _ => StatoPartita.Programmata
        };
    }
}
