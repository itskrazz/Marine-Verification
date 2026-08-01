local HttpService = game:GetService("HttpService")
local ServerStorage = game:GetService("ServerStorage")

local Config = require(
	ServerStorage:WaitForChild("USMCConfig")
)

local ApiClient = {}

local function request(path, payload)
	local response = HttpService:RequestAsync({
		Url = Config.ApiBaseUrl .. path,
		Method = "POST",
		Headers = {
			["Content-Type"] = "application/json",
			["x-usmc-api-key"] = Config.ApiSecret,
		},
		Body = HttpService:JSONEncode(payload),
	})

	if not response.Success then
		error(
			("USMC API request failed (%d): %s"):format(
				response.StatusCode,
				response.Body
			)
		)
	end

	local success, decoded = pcall(function()
		return HttpService:JSONDecode(response.Body)
	end)

	if not success then
		error(
			"USMC API returned invalid JSON: " ..
			response.Body
		)
	end

	return decoded
end

function ApiClient.Verify(robloxUserId, code)
	return request("/api/v1/roblox/verify", {
		robloxUserId = robloxUserId,
		code = code,
	})
end

function ApiClient.Sync(robloxUserId)
	return request("/api/v1/roblox/sync", {
		robloxUserId = robloxUserId,
	})
end

return ApiClient
