import { env } from "./env.js";

const definitions = [
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
];

export const DIVISIONS = Object.freeze(
  definitions.filter(
    (division) =>
      typeof division.roleId === "string" &&
      division.roleId.length > 0
  )
);

export const DEFAULT_TEAM = env.TEAM_DEFAULT;
export const PERSONNEL_TEAM = env.TEAM_PERSONNEL;

/*
 * Compatibility exports for both the original foundation and the rebuilt
 * project. Existing files can import either DIVISIONS or divisions.
 */
export const divisions = DIVISIONS;

export function resolveDivision(memberRoleIds) {
  const match = DIVISIONS
    .filter((division) => memberRoleIds.has(division.roleId))
    .sort((a, b) => b.priority - a.priority)[0];

  return match ?? {
    key: "DEFAULT",
    roleId: null,
    teamName: DEFAULT_TEAM,
    robloxTeam: DEFAULT_TEAM,
    priority: 0
  };
}
