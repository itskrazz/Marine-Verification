import { DIVISIONS, DEFAULT_TEAM, PERSONNEL_TEAM } from '../config/divisions.js';

export function resolveTeam(member) {
  const matchingDivision = DIVISIONS
    .filter((division) => member.roles.cache.has(division.roleId))
    .sort((a, b) => b.priority - a.priority)[0];

  if (matchingDivision) {
    return {
      teamName: matchingDivision.teamName,
      division: matchingDivision.key,
      sourceRoleId: matchingDivision.roleId
    };
  }

  if (member.roles.cache.size > 1) {
    return { teamName: PERSONNEL_TEAM, division: null, sourceRoleId: null };
  }

  return { teamName: DEFAULT_TEAM, division: null, sourceRoleId: null };
}
