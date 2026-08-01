const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

function ids(name) {
  return String(process.env[name] || "").split(",").map(x => x.trim()).filter(Boolean);
}
function hasAnyRole(member, envName) {
  const allowed = ids(envName);
  return allowed.some(id => member.roles.cache.has(id));
}
function isOwner(userId) { return ids("BOT_OWNER_IDS").includes(userId); }
function isAdmin(member) {
  return isOwner(member.id) ||
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    hasAnyRole(member, "ADMIN_ROLE_IDS");
}
function isMod(member) {
  return isAdmin(member) ||
    member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
    hasAnyRole(member, "MODERATOR_ROLE_IDS");
}
function isTrainer(member) {
  return isAdmin(member) || hasAnyRole(member, "TRAINER_ROLE_IDS");
}
function embed(title, description) {
  const e = new EmbedBuilder().setColor(0xA6192E).setTitle(title).setTimestamp();
  if (description) e.setDescription(description);
  return e;
}
function nickname(rank, username, preset="standard") {
  const value = preset === "divider"
    ? `[${rank.abbreviation}] | ${username}`
    : `[${rank.abbreviation}] ${username}`;
  if (value.length > 32) throw new Error("Generated nickname exceeds Discord's 32-character limit.");
  return value;
}
async function safeReply(interaction, payload) {
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply(payload);
}
async function logTo(guild, envName, payload) {
  const id = process.env[envName];
  if (!id) return;
  const channel = await guild.channels.fetch(id).catch(() => null);
  if (channel?.isTextBased()) await channel.send(payload).catch(() => null);
}
module.exports = { ids, isOwner, isAdmin, isMod, isTrainer, embed, nickname, safeReply, logTo };
