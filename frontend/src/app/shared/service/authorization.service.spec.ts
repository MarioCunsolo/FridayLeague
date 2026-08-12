import { AuthorizationService } from './authorization.service';
import { UserDto } from '../../models/api/auth.models';
import { ParticipantDto } from '../../models/api/league.models';

const actor = (role: UserDto['leghe'][number]['ruolo']): UserDto => ({
  id: 'actor-id', nome: 'Attore', cognome: 'Test', email: 'actor@test.it', tema: 'dark', legaId: 'league-id',
  leghe: [{ id: 'league-id', nome: 'Lega', ruolo: role, codiceInvito: 'ABC123', descrizione: null, tipoLegaId: 1, tipoLegaCodice: 'PARTITA_SINGOLA', tipoLegaNome: 'Partita Singola', numeroSquadre: null, numeroGironi: null }]
});

const target = (ruolo: ParticipantDto['ruolo']): ParticipantDto => ({
  userId: 'target-id', nome: 'Target', cognome: 'Test', email: 'target@test.it', ruolo
});

describe('AuthorizationService', () => {
  const service = new AuthorizationService();

  it('allows an ADMIN to manage a CO_ADMIN but not another ADMIN', () => {
    expect(service.canManageParticipant(actor('ADMIN'), target('CO_ADMIN'))).toBeTrue();
    expect(service.canManageParticipant(actor('ADMIN'), target('ADMIN'))).toBeFalse();
  });

  it('allows a CO_ADMIN to remove only a GIOCATORE', () => {
    expect(service.canManageParticipant(actor('CO_ADMIN'), target('GIOCATORE'))).toBeTrue();
    expect(service.canManageParticipant(actor('CO_ADMIN'), target('CO_ADMIN'))).toBeFalse();
  });

  it('never lets a user manage themselves', () => {
    const sameUser = { ...target('GIOCATORE'), userId: 'actor-id' };
    expect(service.canManageParticipant(actor('SUPER_ADMIN'), sameUser)).toBeFalse();
  });
});
