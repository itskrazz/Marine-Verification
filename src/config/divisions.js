import { env } from './env.js';

const definitions = [
  { key: 'HQMC', roleId: env.ROLE_HQMC, teamName: 'Headquarters Marine Corps', priority: 100 },
  { key: 'MARSOC', roleId: env.ROLE_MARSOC, teamName: 'Marine Forces Special Operations Command', priority: 90 },
  { key: 'TECOM', roleId: env.ROLE_TECOM, teamName: 'Training and Education Command', priority: 80 },
  { key: 'MCRD', roleId: env.ROLE_MCRD, teamName: 'Marine Corps Recruit Depot', priority: 70 },
  { key: 'I_MEF', roleId: env.ROLE_I_MEF, teamName: 'I Marine Expeditionary Force', priority: 60 }
];

export const DIVISIONS = Object.freeze(
  definitions.filter((division) => typeof division.roleId === 'string' && division.roleId.length > 0)
);

export const DEFAULT_TEAM = 'Civilian';
export const PERSONNEL_TEAM = 'Marine Corps Personnel';
