import { ChoirMember, UserRole } from '../types/database.types';

export function isOwner(member?: ChoirMember | null): boolean {
  return member?.role === 'owner' && member?.status === 'active';
}

export function isAdmin(member?: ChoirMember | null): boolean {
  return (member?.role === 'owner' || member?.role === 'admin') && member?.status === 'active';
}

export function isSectionLeader(member?: ChoirMember | null): boolean {
  return (
    (member?.role === 'owner' || member?.role === 'admin' || member?.role === 'section_leader') &&
    member?.status === 'active'
  );
}

export function canManageMembers(member?: ChoirMember | null): boolean {
  return isAdmin(member);
}

export function canManageSongs(member?: ChoirMember | null): boolean {
  return isAdmin(member) || (member?.permissions?.can_manage_songs === true);
}

export function canManageEvents(member?: ChoirMember | null): boolean {
  return isAdmin(member) || (member?.permissions?.can_manage_events === true);
}

export function canRecordAttendance(member?: ChoirMember | null): boolean {
  return isSectionLeader(member);
}

export function getRoleBadgeColor(role?: UserRole): string {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300';
    case 'admin':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300';
    case 'section_leader':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
  }
}
