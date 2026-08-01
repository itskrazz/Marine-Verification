local HttpService = game:GetService("HttpService")
local ServerStorage = game:GetService("ServerStorage")

local Config = require(ServerStorage.USMC.Config)

local USMCApiService = {}

local function createHeaders()
    return {
        ["content-type"] = "application/json",
        ["x-usmc-secret"] = Config.ApiSecret,
        ["x-usmc-nonce"] = HttpService:GenerateGUID(false),
        ["x-usmc-timestamp"] = tostring(os.time()),
    }
end

local function request(options)
    local success, response = pcall(function()
        return HttpService:RequestAsync(options)
    end)

    if not success then
        return false, "HTTP request failed: " .. tostring(response)
    end

    local decoded = nil
    if response.Body and response.Body ~= "" then
        local decodeSuccess, result = pcall(HttpService.JSONDecode, HttpService, response.Body)
        if decodeSuccess then
            decoded = result
        end
    end

    if not response.Success then
        local message = decoded and decoded.error or ("HTTP " .. tostring(response.StatusCode))
        return false, message
    end

    return true, decoded
end

function USMCApiService.CompleteVerification(player, code)
    return request({
        Url = Config.ApiBaseUrl .. "/v1/verification/complete",
        Method = "POST",
        Headers = createHeaders(),
        Body = HttpService:JSONEncode({
            code = string.upper(code),
            robloxUserId = player.UserId,
        }),
    })
end

function USMCApiService.ResolveTeam(player)
    return request({
        Url = string.format("%s/v1/team/resolve?robloxUserId=%d", Config.ApiBaseUrl, player.UserId),
        Method = "GET",
        Headers = createHeaders(),
    })
end

return USMCApiService
