const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const member = (o, desc="Select a member") => o.setName("member").setDescription(desc).setRequired(true);
const rank = o => o.setName("rank").setDescription("USMC rank").setRequired(true).setAutocomplete(true);
const reason = o => o.setName("reason").setDescription("Reason").setRequired(true).setMaxLength(500);

const commands = [
  new SlashCommandBuilder().setName("linkroblox").setDescription("Link your Roblox username")
    .addStringOption(o=>o.setName("username").setDescription("Roblox username").setRequired(true).setMinLength(3).setMaxLength(20)),
  new SlashCommandBuilder().setName("profile").setDescription("View a Marine profile").addUserOption(o=>o.setName("member").setDescription("Member; defaults to you")),
  new SlashCommandBuilder().setName("whois").setDescription("View Discord and Marine details").addUserOption(member),
  new SlashCommandBuilder().setName("serverstats").setDescription("View server statistics"),
  new SlashCommandBuilder().setName("membercount").setDescription("View member counts"),
  new SlashCommandBuilder().setName("ping").setDescription("Check bot latency"),
  new SlashCommandBuilder().setName("uptime").setDescription("Check bot uptime"),
  new SlashCommandBuilder().setName("rules").setDescription("Display community rules"),
  new SlashCommandBuilder().setName("suggest").setDescription("Submit a community suggestion")
    .addStringOption(o=>o.setName("suggestion").setDescription("Your suggestion").setRequired(true).setMaxLength(1500)),
  new SlashCommandBuilder().setName("report").setDescription("Privately report a member")
    .addUserOption(member).addStringOption(reason),

  new SlashCommandBuilder().setName("promote").setDescription("Promote a Marine")
    .addUserOption(member).addStringOption(rank).addStringOption(reason),
  new SlashCommandBuilder().setName("demote").setDescription("Demote a Marine")
    .addUserOption(member).addStringOption(rank).addStringOption(reason),
  new SlashCommandBuilder().setName("setrank").setDescription("Set a Marine's rank directly")
    .addUserOption(member).addStringOption(rank).addStringOption(reason),
  new SlashCommandBuilder().setName("rank").setDescription("Rank records")
    .addSubcommand(s=>s.setName("view").setDescription("View current rank").addUserOption(member))
    .addSubcommand(s=>s.setName("history").setDescription("View rank history").addUserOption(member)),
  new SlashCommandBuilder().setName("nickname").setDescription("Manage Marine nicknames")
    .addSubcommand(s=>s.setName("set").setDescription("Choose a nickname format").addUserOption(member)
      .addStringOption(o=>o.setName("preset").setDescription("Format").setRequired(true)
        .addChoices({name:"[Rank] RobloxName",value:"standard"},{name:"[Rank] | RobloxName",value:"divider"})))
    .addSubcommand(s=>s.setName("refresh").setDescription("Refresh a nickname").addUserOption(member)),
  new SlashCommandBuilder().setName("syncnickname").setDescription("Refresh one Marine nickname").addUserOption(member),
  new SlashCommandBuilder().setName("syncnicknames").setDescription("Refresh every saved Marine nickname"),

  new SlashCommandBuilder().setName("warn").setDescription("Warn a member").addUserOption(member).addStringOption(reason),
  new SlashCommandBuilder().setName("warnings").setDescription("View warnings").addUserOption(member),
  new SlashCommandBuilder().setName("clearwarnings").setDescription("Clear warnings").addUserOption(member),
  new SlashCommandBuilder().setName("timeout").setDescription("Timeout a member")
    .addUserOption(member).addIntegerOption(o=>o.setName("minutes").setDescription("Minutes").setRequired(true).setMinValue(1).setMaxValue(40320)).addStringOption(reason),
  new SlashCommandBuilder().setName("untimeout").setDescription("Remove timeout").addUserOption(member),
  new SlashCommandBuilder().setName("kick").setDescription("Kick a member").addUserOption(member).addStringOption(reason),
  new SlashCommandBuilder().setName("ban").setDescription("Ban a member").addUserOption(member).addStringOption(reason),
  new SlashCommandBuilder().setName("purge").setDescription("Delete messages")
    .addIntegerOption(o=>o.setName("amount").setDescription("1-100").setRequired(true).setMinValue(1).setMaxValue(100)),
  new SlashCommandBuilder().setName("lock").setDescription("Lock the current channel"),
  new SlashCommandBuilder().setName("unlock").setDescription("Unlock the current channel"),
  new SlashCommandBuilder().setName("slowmode").setDescription("Set channel slowmode")
    .addIntegerOption(o=>o.setName("seconds").setDescription("0-21600").setRequired(true).setMinValue(0).setMaxValue(21600)),
  new SlashCommandBuilder().setName("role").setDescription("Manage roles")
    .addSubcommand(s=>s.setName("add").setDescription("Add role").addUserOption(member).addRoleOption(o=>o.setName("role").setDescription("Role").setRequired(true)))
    .addSubcommand(s=>s.setName("remove").setDescription("Remove role").addUserOption(member).addRoleOption(o=>o.setName("role").setDescription("Role").setRequired(true))),
  new SlashCommandBuilder().setName("announce").setDescription("Post an announcement")
    .addChannelOption(o=>o.setName("channel").setDescription("Destination").setRequired(true))
    .addStringOption(o=>o.setName("message").setDescription("Announcement").setRequired(true).setMaxLength(2000)),

  new SlashCommandBuilder().setName("training").setDescription("Training management")
    .addSubcommand(s=>s.setName("create").setDescription("Create training").addStringOption(o=>o.setName("title").setDescription("Title").setRequired(true)).addStringOption(o=>o.setName("time").setDescription("Time description").setRequired(true)))
    .addSubcommand(s=>s.setName("start").setDescription("Start training").addIntegerOption(o=>o.setName("id").setDescription("Training ID").setRequired(true)))
    .addSubcommand(s=>s.setName("end").setDescription("End training").addIntegerOption(o=>o.setName("id").setDescription("Training ID").setRequired(true)))
    .addSubcommand(s=>s.setName("cancel").setDescription("Cancel training").addIntegerOption(o=>o.setName("id").setDescription("Training ID").setRequired(true)))
    .addSubcommand(s=>s.setName("attend").setDescription("Add attendee").addIntegerOption(o=>o.setName("id").setDescription("Training ID").setRequired(true)).addUserOption(member))
    .addSubcommand(s=>s.setName("pass").setDescription("Pass attendee").addIntegerOption(o=>o.setName("id").setDescription("Training ID").setRequired(true)).addUserOption(member))
    .addSubcommand(s=>s.setName("fail").setDescription("Fail attendee").addIntegerOption(o=>o.setName("id").setDescription("Training ID").setRequired(true)).addUserOption(member))
    .addSubcommand(s=>s.setName("history").setDescription("Member training history").addUserOption(member))
    .addSubcommand(s=>s.setName("list").setDescription("List recent trainings")),

  new SlashCommandBuilder().setName("maintenance").setDescription("Maintenance mode")
    .addSubcommand(s=>s.setName("enable").setDescription("Enable maintenance").addStringOption(o=>o.setName("message").setDescription("Message").setRequired(true)))
    .addSubcommand(s=>s.setName("disable").setDescription("Disable maintenance"))
    .addSubcommand(s=>s.setName("status").setDescription("View status")),
  new SlashCommandBuilder().setName("botstats").setDescription("View bot and database status"),

  new SlashCommandBuilder().setName("coinflip").setDescription("Flip a coin"),
  new SlashCommandBuilder().setName("dice").setDescription("Roll dice").addIntegerOption(o=>o.setName("sides").setDescription("Number of sides").setMinValue(2).setMaxValue(1000)),
  new SlashCommandBuilder().setName("eightball").setDescription("Ask the magic eight ball").addStringOption(o=>o.setName("question").setDescription("Question").setRequired(true)),
  new SlashCommandBuilder().setName("choose").setDescription("Choose between options").addStringOption(o=>o.setName("choices").setDescription("Separate choices with |").setRequired(true)),
  new SlashCommandBuilder().setName("rate").setDescription("Rate something").addStringOption(o=>o.setName("thing").setDescription("Thing to rate").setRequired(true)),
  new SlashCommandBuilder().setName("rps").setDescription("Rock paper scissors").addStringOption(o=>o.setName("choice").setDescription("Your choice").setRequired(true).addChoices({name:"Rock",value:"rock"},{name:"Paper",value:"paper"},{name:"Scissors",value:"scissors"})),
  new SlashCommandBuilder().setName("marinefact").setDescription("Get a Marine Corps fact"),
  new SlashCommandBuilder().setName("operationname").setDescription("Generate an operation name"),
  new SlashCommandBuilder().setName("callsign").setDescription("Generate a fun callsign"),
  new SlashCommandBuilder().setName("salute").setDescription("Salute a member").addUserOption(member),
  new SlashCommandBuilder().setName("mre").setDescription("Receive a random MRE")
].map(c=>c.toJSON());

module.exports = { commands };
