using LineUp.Api.Data;
using LineUp.Api.DTOs;
using LineUp.Api.Proxies;

namespace LineUp.Api.Services;

public class ReservationService : IReservationService
{
    private readonly IReservationProxy _proxy;
    private readonly IAuthorizationHelper _authorizationHelper;

    public ReservationService(IReservationProxy proxy, IAuthorizationHelper authorizationHelper)
    {
        _proxy = proxy;
        _authorizationHelper = authorizationHelper;
    }

    public async Task<List<ReservationDto>> GetReservationsAsync(Guid userId)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        var partita = await _proxy.GetNextScheduledAsync(legaId);
        if (partita == null) return new List<ReservationDto>();

        var prenotazioni = await _proxy.GetByPartitaAsync(partita.Id);
        return prenotazioni.Select(MappaDto).ToList();
    }

    public async Task<ReservationDto> CreateReservationAsync(Guid userId, CreateReservationRequest request)
    {
        var legaId = await GetLegaAttivaAsync(userId);

        if (string.IsNullOrWhiteSpace(request.NomeCognome))
        {
            throw new BadRequestException("Il nome è obbligatorio.");
        }

        ValidaFinestraPrenotazione();

        var partita = await _proxy.GetNextScheduledAsync(legaId)
            ?? throw new BadRequestException("Nessuna partita in programma per cui prenotarsi.");

        var membro = await _proxy.FindMembroByNomeCompletoAsync(legaId, request.NomeCognome);

        if (membro != null)
        {
            var esistente = await _proxy.GetByPartitaAndUserIdAsync(partita.Id, membro.Id);
            if (esistente != null)
            {
                throw new BadRequestException("Esiste già una prenotazione per questo giocatore.");
            }
        }

        var prenotazione = new Prenotazione
        {
            PartitaId = partita.Id,
            UserId = membro?.Id,
            PrenotatoDaUserId = userId,
            NomeCognome = request.NomeCognome.Trim(),
            DataOra = DateTime.Now
        };

        await _proxy.CreateAsync(prenotazione);
        prenotazione.User = membro;
        return MappaDto(prenotazione);
    }

    public async Task DeleteReservationAsync(Guid userId, Guid playerId)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        var partita = await _proxy.GetNextScheduledAsync(legaId)
            ?? throw new NotFoundException("Nessuna partita in programma.");

        var prenotazione = await _proxy.GetByPartitaAndUserIdAsync(partita.Id, playerId)
            ?? throw new NotFoundException("Prenotazione non trovata.");

        var isProprietarioOChiHaPrenotato = prenotazione.UserId == userId || prenotazione.PrenotatoDaUserId == userId;
        if (!isProprietarioOChiHaPrenotato && !await _authorizationHelper.IsAdminOrCoAdminAsync(userId, legaId))
        {
            throw new ForbiddenException("Non hai i permessi per eliminare questa prenotazione.");
        }

        await _proxy.DeleteAsync(prenotazione);
    }

    public async Task<List<ReservationDto>> SeedDummyReservationsAsync(Guid userId)
    {
        var legaId = await GetLegaAttivaAsync(userId);
        var partita = await _proxy.GetNextScheduledAsync(legaId)
            ?? throw new BadRequestException("Nessuna partita in programma per cui popolare le prenotazioni.");

        var prenotazioniEsistenti = await _proxy.GetByPartitaAsync(partita.Id);

        var nomiFittizi = new string[]
        {
            "Salvo Vitale", "Mario Cunsolo", "Giuseppe Rossi", "Luca Bianchi", "Marco Neri",
            "Andrea Gialli", "Roberto Verdi", "Franco Nipotini", "Giorgio Vanni", "Stefano Sogni"
        };

        foreach (var nome in nomiFittizi)
        {
            if (!prenotazioniEsistenti.Any(p => p.NomeCognome.Equals(nome, StringComparison.OrdinalIgnoreCase)))
            {
                var membro = await _proxy.FindMembroByNomeCompletoAsync(legaId, nome);
                var nuova = new Prenotazione
                {
                    PartitaId = partita.Id,
                    UserId = membro?.Id,
                    PrenotatoDaUserId = userId,
                    NomeCognome = nome,
                    DataOra = DateTime.Now
                };
                await _proxy.CreateAsync(nuova);
            }
        }

        var aggiornate = await _proxy.GetByPartitaAsync(partita.Id);
        return aggiornate.Select(MappaDto).ToList();
    }

    // Le prenotazioni sono chiuse dal sabato (tutto il giorno) fino a domenica alle 17:00, come da regola già in vigore lato frontend.
    private static void ValidaFinestraPrenotazione()
    {
        var now = DateTime.Now;
        if (now.DayOfWeek == DayOfWeek.Saturday || (now.DayOfWeek == DayOfWeek.Sunday && now.Hour < 17))
        {
            throw new BadRequestException("Le prenotazioni sono chiuse dal sabato fino a domenica alle 17:00.");
        }
    }

    private static ReservationDto MappaDto(Prenotazione p) => new()
    {
        Id = p.Id,
        NomeCognome = p.NomeCognome,
        DataOra = p.DataOra,
        PlayerId = p.UserId
    };

    private async Task<Guid> GetLegaAttivaAsync(Guid userId) =>
        await _proxy.GetActiveLegaIdAsync(userId) ?? throw new BadRequestException("Nessuna lega attiva selezionata.");
}
