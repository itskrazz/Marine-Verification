import { env } from "./env.js";

export const divisions = Object.freeze([
  {
    key: "HQMC",
    priority: 100,
    discordRoleId: env.ROLE_HQMC,
    robloxTeam: env.TEAM_HQMC
  },
  {
    key: "MARSOC",
    priority: 90,
    discordRoleId: env.ROLE_MARSOC,
    robloxTeam: env.TEAM_MARSOC
  },
  {
    key: "TECOM",
    priority: 80,
    discordRoleId: env.ROLE_TECOM,
    robloxTeam: env.TEAM_TECOM
  },
  {
    key: "MCRD",
    priority: 70,
    discordRoleId: env.ROLE_MCRD,
    robloxTeam: env.TEAM_MCRD
  },
  {
    key: "I_MEF",
    priority: 60,
    discordRoleId: env.ROLE_I_MEF,
    robloxTeam: env.TEAM_I_MEF
  }
].filter((division) => division.discordRoleId));

export function resolveDivision(memberRoleIds) {
  const matches = divisions
    .filter((division) => memberRoleIds.has(division.discordRoleId))
    .sort((a, b) => b.priority - a.priority);

  return matches[0] ?? {
    key: "DEFAULT",
    priority: 0,
    discordRoleId: null,
    robloxTeam: env.TEAM_DEFAULT
  };
}
