import { env } from "./env.js";

export const DIVISIONS = Object.freeze(
  [
    {
      key: "HQMC",
      roleId: env.ROLE_HQMC,
      teamName: env.TEAM_HQMC,
      priority: 100
    },
    {
      key: "MARSOC",
      roleId: env.ROLE_MARSOC,
      teamName: env.TEAM_MARSOC,
      priority: 90
    },
    {
      key: "TECOM",
      roleId: env.ROLE_TECOM,
      teamName: env.TEAM_TECOM,
      priority: 80
    },
    {
      key: "MCRD",
      roleId: env.ROLE_MCRD,
      teamName: env.TEAM_MCRD,
      priority: 70
    },
    {
      key: "I_MEF",
      roleId: env.ROLE_I_MEF,
      teamName: env.TEAM_I_MEF,
      priority: 60
    }
  ].filter((division) => division.roleId)
);

export function resolveTeam(memberRoleIds) {
  const division = DIVISIONS
    .filter((item) => memberRoleIds.has(item.roleId))
    .sort((a, b) => b.priority - a.priority)[0];

  if (division) {
    return {
      division: division.key,
      team: division.teamName
    };
  }

  return {
    division: "PERSONNEL",
    team: env.TEAM_PERSONNEL
  };
}
