param(
    [string]$InputFile
)

if ([string]::IsNullOrWhiteSpace($InputFile)) {
    Write-Host "ERROR: input filename is required." -ForegroundColor Red
    Write-Host 'Usage: Get XK Range.ps1 "filename.txt"'
    exit 1
}

$InputFile = $InputFile.Trim().Trim('"').Trim("'")

if (-not [System.IO.Path]::IsPathRooted($InputFile)) {
    $InputFile = Join-Path (Get-Location).Path $InputFile
}

if (-not (Test-Path -LiteralPath $InputFile -PathType Leaf)) {
    Write-Host "ERROR: input file not found: $InputFile" -ForegroundColor Red
    exit 1
}

$InputFile = (Resolve-Path -LiteralPath $InputFile).Path

$scriptName = [System.IO.Path]::GetFileNameWithoutExtension($MyInvocation.MyCommand.Name)
$sourceFileName = [System.IO.Path]::GetFileNameWithoutExtension($InputFile)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$outputFile = Join-Path $scriptDir ($scriptName + "+" + $sourceFileName + "-output.txt")

$regexModel = '(?i)\b(XK8|XKR|XK)\b'
$cutoffYear = 1995
$matchCount = 0
$lineNumber = 0

$reader = $null
$writer = $null

try {
    $reader = New-Object System.IO.StreamReader($InputFile, [System.Text.Encoding]::UTF8, $true)

    $header = $reader.ReadLine()
    $lineNumber++

    if ($null -eq $header) {
        throw "Input file is empty."
    }

    $headers = $header.Split(';')

    $makeIndex = [Array]::IndexOf($headers, "merkkiSelvakielinen")
    $modelIndex = [Array]::IndexOf($headers, "mallimerkinta")
    $dateIndex = [Array]::IndexOf($headers, "kayttoonottopvm")

    if ($makeIndex -lt 0) {
        throw "Column 'merkkiSelvakielinen' was not found."
    }

    if ($modelIndex -lt 0) {
        throw "Column 'mallimerkinta' was not found."
    }

    if ($dateIndex -lt 0) {
        throw "Column 'kayttoonottopvm' was not found."
    }

    $writer = New-Object System.IO.StreamWriter($outputFile, $false, [System.Text.Encoding]::UTF8)

    $writer.WriteLine($header)

    while (($line = $reader.ReadLine()) -ne $null) {

        $lineNumber++

        Write-Host "`rScanned lines: $lineNumber    Matches: $matchCount" -NoNewline

        $fields = $line.Split(';')

        if ($fields.Count -le $makeIndex) {
            continue
        }

        if ($fields.Count -le $modelIndex) {
            continue
        }

        if ($fields.Count -le $dateIndex) {
            continue
        }

        if ($fields[$makeIndex].Trim() -ne "Jaguar") {
            continue
        }

        if (-not ($fields[$modelIndex] -match $regexModel)) {
            continue
        }

        $date = $fields[$dateIndex].Trim()

        if ($date -notmatch '^\d{8}$') {
            continue
        }

        $year = [int]$date.Substring(0,4)

        if ($year -le $cutoffYear) {
            continue
        }

        $writer.WriteLine($line)
        $matchCount++
    }
}
catch {
    Write-Host ""
    Write-Host "ERROR while processing file:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
finally {
    if ($null -ne $writer) {
        $writer.Dispose()
    }

    if ($null -ne $reader) {
        $reader.Dispose()
    }
}

Write-Host ""
Write-Host "Scanned lines: $lineNumber"
Write-Host "Matches: $matchCount"
Write-Host "Output: $outputFile"