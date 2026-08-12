import { Injectable } from '@angular/core';
import { UserDto } from '../../models/api/auth.models';
import { LeagueRole } from '../../models/api/core.models';
import { ParticipantDto } from '../../models/api/league.models';
import { Reservation } from '../../models/interface/reservation.interface';

@Injectable({ providedIn: 'root' })
export class AuthorizationService {
  activeRole(user: UserDto | null): LeagueRole | null {
    if (!user?.legaId) return null;
    return user.leghe.find(league => league.id === user.legaId)?.ruolo ?? null;
  }

  canAccessLeagueSettings(user: UserDto | null): boolean {
    const role = this.activeRole(user);
    return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CO_ADMIN';
  }

  canViewActivityLog(user: UserDto | null): boolean {
    const role = this.activeRole(user);
    return role === 'SUPER_ADMIN' || role === 'ADMIN';
  }

  canManageParticipant(actor: UserDto | null, target: ParticipantDto): boolean {
    if (!actor || actor.id === target.userId || target.ruolo === 'SUPER_ADMIN') return false;
    switch (this.activeRole(actor)) {
      case 'SUPER_ADMIN': return true;
      case 'ADMIN': return target.ruolo === 'CO_ADMIN' || target.ruolo === 'GIOCATORE';
      case 'CO_ADMIN': return target.ruolo === 'GIOCATORE';
      default: return false;
    }
  }

  canChangeParticipantRole(actor: UserDto | null, target: ParticipantDto): boolean {
    const role = this.activeRole(actor);
    return (role === 'SUPER_ADMIN' || role === 'ADMIN') && this.canManageParticipant(actor, target);
  }

  canDeleteReservation(actor: UserDto | null, reservation: Reservation): boolean {
    if (!actor) return false;
    const role = this.activeRole(actor);
    return reservation.playerId === actor.id || reservation.prenotatoDaUserId === actor.id ||
      role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CO_ADMIN';
  }

  canManageMatch(user: UserDto | null): boolean {
    return this.canViewActivityLog(user);
  }
}
