local Players = game:GetService("Players")
local Teams = game:GetService("Teams")
local ServerStorage = game:GetService("ServerStorage")

local Config = require(ServerStorage.USMC.Config)
local USMCApiService = require(script.Parent.Services.USMCApiService)

local function assignTeam(player, teamName)
    local team = Teams:FindFirstChild(teamName)
    if not team or not team:IsA("Team") then
        warn(string.format("[USMC] Team '%s' does not exist.", teamName))
        team = Teams:FindFirstChild(Config.DefaultTeam)
    end

    if team then
        player.Team = team
        player.Neutral = false
    end
end

local function synchronizePlayer(player)
    local success, result = USMCApiService.ResolveTeam(player)
    if success and result and result.teamName then
        assignTeam(player, result.teamName)
    else
        assignTeam(player, Config.DefaultTeam)
    end
end

local function handleChat(player, message)
    local prefix = Config.VerificationCommand .. " "
    if string.sub(string.lower(message), 1, #prefix) ~= string.lower(prefix) then
        return
    end

    local code = string.gsub(string.sub(message, #prefix + 1), "%s+", "")
    if #code < 6 then
        return
    end

    local success = USMCApiService.CompleteVerification(player, code)
    if success then
        synchronizePlayer(player)
    end
end

Players.PlayerAdded:Connect(function(player)
    player.Chatted:Connect(function(message)
        handleChat(player, message)
    end)

    task.spawn(synchronizePlayer, player)
end)
