[CmdletBinding()]
param(
    [string]$ApiKey = $env:SMIRIS_API_KEY,
    [string]$BaseUrl = "https://frftiwiqqehyiyjybemx.supabase.co/functions/v1",
    [switch]$RunWriteTests,
    [switch]$Cleanup
)

$ErrorActionPreference = "Stop"

if (-not $ApiKey) {
    $ApiKey = Read-Host "API key (sm_live_...)"
}

if (-not $ApiKey.StartsWith("sm_live_")) {
    throw "An API key starting with sm_live_ is required."
}

$headers = @{
    "X-API-Key" = $ApiKey
    "Content-Type" = "application/json"
}

function Invoke-SmirisApi {
    param(
        [Parameter(Mandatory)] [string]$Method,
        [Parameter(Mandatory)] [string]$Endpoint,
        [object]$Body
    )

    $request = @{
        Method = $Method
        Uri = "$BaseUrl$Endpoint"
        Headers = $headers
        UseBasicParsing = $true
    }

    if ($null -ne $Body) {
        $request.Body = $Body | ConvertTo-Json -Depth 10 -Compress
    }

    try {
        $response = Invoke-WebRequest @request
        return @{ Success = $true; StatusCode = [int]$response.StatusCode; Data = $response.Content | ConvertFrom-Json }
    } catch {
        $statusCode = 500
        $data = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode.value__
            try {
                $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $data = $reader.ReadToEnd() | ConvertFrom-Json
                $reader.Dispose()
            } catch {}
        }
        return @{ Success = $false; StatusCode = $statusCode; Data = $data; Error = $_.Exception.Message }
    }
}

function Assert-ApiSuccess {
    param([hashtable]$Result, [string]$Name)

    if ($Result.Success) {
        Write-Host "[OK] $Name (HTTP $($Result.StatusCode))" -ForegroundColor Green
        return $true
    }

    $message = if ($Result.Data -and $Result.Data.error) { $Result.Data.error } else { $Result.Error }
    Write-Host "[FAIL] $Name (HTTP $($Result.StatusCode)): $message" -ForegroundColor Red
    return $false
}

Write-Host "Smiris Learn API test" -ForegroundColor Cyan

$accounts = Invoke-SmirisApi -Method "GET" -Endpoint "/list-accounts?page=1&limit=5"
if (-not (Assert-ApiSuccess $accounts "List accounts")) {
    throw "A super-admin API key is required for this test script."
}

if (-not $RunWriteTests) {
    Write-Host "Read-only test completed. Add -RunWriteTests to create and test temporary data." -ForegroundColor Yellow
    exit 0
}

$suffix = [guid]::NewGuid().ToString("N").Substring(0, 10)
$password = "Test!" + [guid]::NewGuid().ToString("N")
$companyEmail = "admin-$suffix@api-test.invalid"
$studentEmail = "student-$suffix@api-test.invalid"
$organizationId = $null
$adminId = $null
$studentId = $null

try {
    $account = Invoke-SmirisApi -Method "POST" -Endpoint "/create-account" -Body @{
        companyName = "API Test $suffix"
        adminEmail = $companyEmail
        adminPassword = $password
        plan = "free"
    }
    if (-not (Assert-ApiSuccess $account "Create test organization")) { throw "Cannot continue." }

    $organizationId = $account.Data.organization_id
    $adminId = $account.Data.admin_user_id

    $student = Invoke-SmirisApi -Method "POST" -Endpoint "/add-student/organizations/$organizationId/students" -Body @{
        email = $studentEmail
        fullName = "API Test Student"
        password = $password
        groupIds = @()
    }
    if (-not (Assert-ApiSuccess $student "Add test student")) { throw "Cannot continue." }
    $studentId = $student.Data.student_id

    $listStudents = Invoke-SmirisApi -Method "GET" -Endpoint "/list-students/${organizationId}?page=1&limit=20"
    if (-not (Assert-ApiSuccess $listStudents "List test students")) { throw "Cannot continue." }

    $updateStudent = Invoke-SmirisApi -Method "PATCH" -Endpoint "/update-student/$studentId" -Body @{
        fullName = "API Updated Student"
        suspended = $false
    }
    if (-not (Assert-ApiSuccess $updateStudent "Update test student")) { throw "Cannot continue." }

    $deleteStudent = Invoke-SmirisApi -Method "DELETE" -Endpoint "/delete-student/$studentId"
    if (-not (Assert-ApiSuccess $deleteStudent "Delete test student")) { throw "Cannot continue." }
    $studentId = $null
} finally {
    if ($Cleanup -and $adminId) {
        $deleteAccount = Invoke-SmirisApi -Method "DELETE" -Endpoint "/delete-account/$adminId"
        [void](Assert-ApiSuccess $deleteAccount "Delete test organization")
    } elseif ($organizationId) {
        Write-Host "Test organization kept: $organizationId" -ForegroundColor Yellow
        Write-Host "Run again with -Cleanup to remove test organizations automatically." -ForegroundColor Yellow
    }

    Remove-Variable ApiKey -ErrorAction SilentlyContinue
}
