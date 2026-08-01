local Players = game:GetService("Players")
local Teams = game:GetService("Teams")

local ApiClient = require(
	script.Parent:WaitForChild("USMCApiClient")
)

local function assignTeam(player, teamName)
	local team = Teams:FindFirstChild(teamName)

	if not team then
		warn(
			("USMC team '%s' does not exist."):format(
				teamName
			)
		)
		return false
	end

	player.Team = team
	player.Neutral = false

	print(
		("USMC assigned %s to %s."):format(
			player.Name,
			teamName
		)
	)

	return true
end

local function syncPlayer(player)
	local success, result = pcall(function()
		return ApiClient.Sync(player.UserId)
	end)

	if not success then
		local errorText = tostring(result)

		if string.find(
			errorText,
			"Roblox account is not linked",
			1,
			true
		) then
			print(
				("USMC: %s has not verified yet."):format(
					player.Name
				)
			)
			return
		end

		warn(
			("USMC sync failed for %s: %s"):format(
				player.Name,
				errorText
			)
		)
		return
	end

	if result.verified and result.team then
		assignTeam(player, result.team)
	end
end

local function verifyPlayer(player, code)
	print(
		("USMC verification attempt from %s."):format(
			player.Name
		)
	)

	local success, result = pcall(function()
		return ApiClient.Verify(
			player.UserId,
			string.upper(code)
		)
	end)

	if not success then
		warn(
			("USMC verification failed for %s: %s"):format(
				player.Name,
				tostring(result)
			)
		)
		return
	end

	if result.verified then
		print(
			("USMC verification completed for %s."):format(
				player.Name
			)
		)

		if result.team then
			assignTeam(player, result.team)
		end
	end
end

local function onPlayerAdded(player)
	task.spawn(syncPlayer, player)

	player.Chatted:Connect(function(message)
		local command, code = message:match(
			"^(%S+)%s+([A-Fa-f0-9]+)%s*$"
		)

		if not command or not code then
			return
		end

		if string.lower(command) ~= "!verify" then
			return
		end

		verifyPlayer(player, code)
	end)
end

for _, player in Players:GetPlayers() do
	onPlayerAdded(player)
end

Players.PlayerAdded:Connect(onPlayerAdded)
