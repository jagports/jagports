[CmdletBinding(PositionalBinding=$false)]
param(
    [string]$Root = "C:\Program Files\JEPC\applications\JEPC",
    [string]$Model,
    [string]$Category,
    [string]$PartNumber,
    [switch]$Inventory,
    [string]$OutDir = (Join-Path (Get-Location).Path "jepc-applicability")
)

$ErrorActionPreference = "Stop"
$script:FileCache = @{}
$script:AttributeFileCache = @{}
$script:AttributeDiscoveryCache = @{}

function Read-JepcData {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return @() }

    $full = [IO.Path]::GetFullPath($Path)
    if ($script:FileCache.ContainsKey($full)) { return $script:FileCache[$full] }

    Write-Host ""
    Write-Host "*** Reading $full"

    $rows = @(Get-Content -LiteralPath $full | ForEach-Object {
        $x = $_.Trim()
        if ($x -and -not $x.StartsWith("<?xml") -and $x -ne "<Data>" -and $x -ne "</Data>") { $x }
    })

    Write-Host "    $($rows.Count) data rows"
    $script:FileCache[$full] = $rows
    return $rows
}

function Split-JepcRow {
    param([string]$Line)
    if ([string]::IsNullOrWhiteSpace($Line) -or -not $Line.StartsWith("[") -or -not $Line.EndsWith("]")) { return $null }

    $s = $Line.Substring(1, $Line.Length - 2)
    $fields = New-Object System.Collections.Generic.List[string]
    $buf = New-Object Text.StringBuilder
    $quoted = $false

    for ($i = 0; $i -lt $s.Length; $i++) {
        $c = $s[$i]
        if ($c -eq "'") { $quoted = -not $quoted; continue }
        if ($c -eq "," -and -not $quoted) {
            $fields.Add($buf.ToString().Trim())
            $buf.Clear() | Out-Null
            continue
        }
        [void]$buf.Append($c)
    }

    $fields.Add($buf.ToString().Trim())
    return ,$fields.ToArray()
}

function Parse-RuleTuples {
    param([string]$Raw, [string]$Scope, [int]$RuleIndex)

    $result = New-Object System.Collections.Generic.List[object]
    $tupleIndex = 0

    foreach ($m in [regex]::Matches($Raw, '\[(?<body>[^\]]+)\]')) {
        $parts = @($m.Groups["body"].Value.Split(",") | ForEach-Object { $_.Trim() })
        if ($parts.Count -lt 3) { continue }

        $group = [string]$parts[0]
        if ($group -ne "C" -and $group -notmatch '^A\d+$') { continue }

        $tupleIndex++
        $flag2 = ""
        $flag3 = ""
        if ($parts.Count -ge 4) { $flag2 = [string]$parts[3] }
        if ($parts.Count -ge 5) { $flag3 = [string]$parts[4] }

        $result.Add([pscustomobject]@{
            Scope=$Scope; RuleIndex=$RuleIndex; TupleIndex=$tupleIndex
            Group=$group; Value=[string]$parts[1]; Flag1=[string]$parts[2]
            Flag2=$flag2; Flag3=$flag3; Raw=$m.Value
        })
    }

    return $result
}

function Get-Rules {
    param([string]$Path, [string]$Key, [string]$Scope)

    $result = New-Object System.Collections.Generic.List[object]
    if (-not (Test-Path -LiteralPath $Path)) { return $result }

    $ruleIndex = 0
    foreach ($line in Read-JepcData $Path) {
        $comma = $line.IndexOf(",")
        if ($comma -lt 1) { continue }

        $recordKey = $line.Substring(0, $comma).Trim()
        if ($recordKey -ne $Key) { continue }

        $ruleIndex++
        $result.Add([pscustomobject]@{
            Scope=$Scope
            RuleIndex=$ruleIndex
            RawRule=$line.Substring($comma + 1).Trim()
            SourceFile=[IO.Path]::GetFileName($Path)
        })
    }

    return $result
}

function Get-Tree {
    param([string]$Path)

    $nodes = @{}
    $rows = New-Object System.Collections.Generic.List[object]

    foreach ($line in Read-JepcData $Path) {
        $f = Split-JepcRow $line
        if ($null -eq $f -or $f.Count -lt 3) { continue }

        $row = [pscustomobject]@{
            Parent=[string]$f[0]
            Id=[string]$f[1]
            Label=[string]$f[2]
            Fields=$f
        }

        $rows.Add($row)
        $nodes[$row.Id] = $row
    }

    return [pscustomobject]@{ Nodes=$nodes; Rows=$rows }
}

function Get-Path {
    param([hashtable]$Nodes, [string]$ParentId)

    $reverse = New-Object System.Collections.Generic.List[object]
    $guard = 0

    while ($Nodes.ContainsKey($ParentId) -and $guard -lt 100) {
        $node = $Nodes[$ParentId]
        $reverse.Add($node)
        $ParentId = $node.Parent
        $guard++
    }

    $forward = New-Object System.Collections.Generic.List[object]
    for ($i = $reverse.Count - 1; $i -ge 0; $i--) { $forward.Add($reverse[$i]) }
    return $forward
}

function Parse-VinLabel {
    param([string]$Label)
    if ([string]::IsNullOrWhiteSpace($Label)) { return @() }

    $x = $Label.Trim()

    if ($x -match '(?i)^From\s+VIN\s*\(([^)]+)\)\s*To\s+VIN\s*\(([^)]+)\)$') {
        return ,([pscustomobject]@{ From=$Matches[1].Trim(); To=$Matches[2].Trim(); Raw=$x })
    }
    if ($x -match '(?i)^From\s+VIN\s*\(([^)]+)\)$') {
        return ,([pscustomobject]@{ From=$Matches[1].Trim(); To=""; Raw=$x })
    }
    if ($x -match '(?i)^To\s+VIN\s*\(([^)]+)\)$') {
        return ,([pscustomobject]@{ From=""; To=$Matches[1].Trim(); Raw=$x })
    }

    return @()
}

function Get-CategoryInfo {
    param([int]$M, [int]$C)

    $path = Join-Path $Root "drilldown\pl_id_$M\L0\cat_M$($M)_C$($C)_L0.xml"
    $cataloguePath = ""
    $imageRef = ""

    foreach ($line in Read-JepcData $path) {
        if (-not $cataloguePath -and $line -match '^\[(.+/.+)\]$') {
            $cataloguePath = $Matches[1].Trim()
            continue
        }
        if (-not $imageRef -and $line -match '^\[([A-Za-z0-9_-]+)\]$') {
            $imageRef = $Matches[1].Trim()
        }
    }

    return [pscustomobject]@{
        Model="M$M"
        Category="C$C"
        CataloguePath=$cataloguePath
        ImageRef=$imageRef
    }
}

function Get-TopLabel {
    param([int]$M, [int]$C, [int]$I)

    $path = Join-Path $Root "drilldown\pl_id_$M\L0\tl_M$($M)_C$($C)_L0.xml"
    if (-not (Test-Path -LiteralPath $path)) { return "" }

    foreach ($line in Read-JepcData $path) {
        $f = Split-JepcRow $line
        if ($null -ne $f -and $f.Count -ge 2 -and [string]$f[0] -eq [string]$I) {
            return [string]$f[1]
        }
    }

    return ""
}

function Get-Effect {
    param([object]$Tuple)
    if ($Tuple.Flag1 -eq "0") { return "INCLUDE" }
    if ($Tuple.Flag1 -eq "1") { return "EXCLUDE" }
    return "RAW"
}

function Get-ModelAttributeFiles {
    param([int]$M)

    $key = [string]$M
    if ($script:AttributeFileCache.ContainsKey($key)) { return $script:AttributeFileCache[$key] }

    $files = New-Object System.Collections.Generic.List[string]
    $modelRoot = Join-Path $Root "drilldown\pl_id_$M"

    if (Test-Path -LiteralPath $modelRoot) {
        Get-ChildItem -LiteralPath $modelRoot -Recurse -File -Filter "*_attributes.xml" | ForEach-Object {
            $files.Add($_.FullName)
        }
    }

    $menuAttributes = Join-Path $Root "menus\pl_id_$($M)_attributes.xml"
    if (Test-Path -LiteralPath $menuAttributes) { $files.Add($menuAttributes) }

    $script:AttributeFileCache[$key] = @($files)
    Write-Host ""
    Write-Host "Model M$M attribute files indexed: $($files.Count)"
    return $script:AttributeFileCache[$key]
}

function Find-AttributeEvidenceInModel {
    param([int]$M, [string]$Group, [string]$Value)

    $cacheKey = "$M|$Group|$Value"
    if ($script:AttributeDiscoveryCache.ContainsKey($cacheKey)) {
        return $script:AttributeDiscoveryCache[$cacheKey]
    }

    $files = @(Get-ModelAttributeFiles $M)
    if ($files.Count -eq 0) {
        $result = [pscustomobject]@{
            Label=""; Status="UNRESOLVED"; Source="MODEL_SOURCE_SEARCH"; HitCount=0; ExactJoinCount=0
            MatchFiles=""
        }
        $script:AttributeDiscoveryCache[$cacheKey] = $result
        return $result
    }

    $pattern = '\[' + [regex]::Escape($Group) + '\s*,\s*' + [regex]::Escape($Value) + '\s*,'

    Write-Host ""
    Write-Host "*** Searching model M$M source for $Group=$Value"

    $hits = @(Select-String -Path $files -Pattern $pattern -CaseSensitive:$false)
    Write-Host "    Select-String hits: $($hits.Count)"

    $evidence = New-Object System.Collections.Generic.List[object]
    $matchedFiles = New-Object System.Collections.Generic.List[string]

    foreach ($hit in $hits) {
        $line = $hit.Line.Trim()
        $comma = $line.IndexOf(",")
        if ($comma -lt 1) { continue }

        $recordKey = $line.Substring(0, $comma).Trim()
        $rawRule = $line.Substring($comma + 1).Trim()
        $tuples = @(Parse-RuleTuples $rawRule "DISCOVERY" 1)

        $target = @($tuples | Where-Object { $_.Group -eq $Group -and $_.Value -eq $Value })
        if ($target.Count -eq 0) { continue }

        $fileName = [IO.Path]::GetFileName($hit.Path)
        if (-not $matchedFiles.Contains($fileName)) { $matchedFiles.Add($fileName) }
        if ($fileName -notmatch '(?i)^Itm_M(\d+)_C(\d+)_I(\d+)_attributes\.xml$') { continue }

        $dm = [int]$Matches[1]
        $dc = [int]$Matches[2]
        $di = [int]$Matches[3]

        $attributesDir = Split-Path -Parent $hit.Path
        $l0 = Join-Path (Join-Path $attributesDir "L0") "Itm_M$($dm)_C$($dc)_I$($di)_L0.xml"
        if (-not (Test-Path -LiteralPath $l0)) { continue }

        $tree = Get-Tree $l0

        $leafMatches = @($tree.Rows | Where-Object {
            $fields = $_.Fields
            $fields.Count -ge 4 -and ([string]$fields[$fields.Count - 1]).Trim() -eq $recordKey
        })

        foreach ($leaf in $leafMatches) {
            $pathNodes = @(Get-Path $tree.Nodes $leaf.Parent)

            $labels = @($pathNodes | Where-Object {
                -not [string]::IsNullOrWhiteSpace($_.Label) -and
                @(Parse-VinLabel ([string]$_.Label)).Count -eq 0
            } | ForEach-Object { [string]$_.Label } | Select-Object -Unique)

            $aTuples = @($tuples | Where-Object { $_.Group -match '^A\d+$' })
            $candidate = ""
            $joinStatus = "EXACT_PATH_CONTEXT"

            if ($aTuples.Count -eq 1 -and $labels.Count -eq 1) {
                $candidate = $labels[0]
                $joinStatus = "EXACT_SOURCE_JOIN"
            }

            $evidence.Add([pscustomobject]@{
                Model="M$dm"
                Category="C$dc"
                Item="I$di"
                ApplicationId=$recordKey
                CandidateLabel=$candidate
                JoinStatus=$joinStatus
                FullTreePath=($labels -join " > ")
                SourceFile=$fileName
            })
        }
    }

    $exactLabels = @($evidence | Where-Object {
        $_.JoinStatus -eq "EXACT_SOURCE_JOIN" -and
        -not [string]::IsNullOrWhiteSpace($_.CandidateLabel)
    } | Select-Object -ExpandProperty CandidateLabel -Unique)

    $label = ""
    $status = "UNRESOLVED"

    if ($exactLabels.Count -eq 1) {
        $label = $exactLabels[0]
        $status = "DISCOVERED_MODEL_SOURCE_JOIN"
    }
    elseif ($exactLabels.Count -gt 1) {
        $status = "AMBIGUOUS"
    }

    $result = [pscustomobject]@{
        Label=$label
        Status=$status
        Source="MODEL_SOURCE_SEARCH"
        HitCount=$hits.Count
        ExactJoinCount=@($evidence | Where-Object { $_.JoinStatus -eq "EXACT_SOURCE_JOIN" }).Count
        MatchFiles=(@($matchedFiles | Sort-Object -Unique) -join " | ")
    }

    $script:AttributeDiscoveryCache[$cacheKey] = $result
    return $result
}

if (($Model -and -not $Category) -or ($Category -and -not $Model)) {
    throw "-Model and -Category must be supplied together."
}
if (-not (($Model -and $Category) -or $PartNumber)) {
    throw "Use (-Model NNNN -Category MMMM) or -PartNumber PPPP."
}
if (-not (Test-Path -LiteralPath $Root)) {
    throw "JEPC root not found: $Root"
}

$ModelId = $null
$CategoryId = $null

if ($Model -and $Category) {
    if ($Model -notmatch '^M?(\d+)$') { throw "Invalid -Model '$Model'." }
    $ModelId = [int]$Matches[1]

    if ($Category -notmatch '^C?(\d+)$') { throw "Invalid -Category '$Category'." }
    $CategoryId = [int]$Matches[1]
}

if ($Inventory) {
    New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
}

$categoryRows = New-Object System.Collections.Generic.List[object]
$occurrences = New-Object System.Collections.Generic.List[object]
$rawRules = New-Object System.Collections.Generic.List[object]
$rawFilters = New-Object System.Collections.Generic.List[object]
$boundaries = New-Object System.Collections.Generic.List[object]
$localDecodeEvidence = New-Object System.Collections.Generic.List[object]

$modelIds = New-Object System.Collections.Generic.List[int]

if ($PartNumber) {
    Get-ChildItem -LiteralPath (Join-Path $Root "drilldown") -Directory | ForEach-Object {
        if ($_.Name -match '^pl_id_(\d+)$') { $modelIds.Add([int]$Matches[1]) }
    }
}
else {
    $modelIds.Add($ModelId)
}

foreach ($m in $modelIds) {
    $modelRoot = Join-Path $Root "drilldown\pl_id_$m"
    $l0Root = Join-Path $modelRoot "L0"
    if (-not (Test-Path -LiteralPath $l0Root)) { continue }

    if ($ModelId -eq $m) {
        $itemPattern = "Itm_M$($m)_C$($CategoryId)_I*_L0.xml"
    }
    else {
        $itemPattern = "Itm_M$($m)_C*_I*_L0.xml"
    }

    $itemFiles = @(Get-ChildItem -LiteralPath $l0Root -File | Where-Object { $_.Name -like $itemPattern } | Sort-Object Name)

    foreach ($file in $itemFiles) {
        if ($file.Name -notmatch '^Itm_M(\d+)_C(\d+)_I(\d+)_L0\.xml$') { continue }

        $tm = [int]$Matches[1]
        $tc = [int]$Matches[2]
        $ti = [int]$Matches[3]

        $categoryInfo = Get-CategoryInfo $tm $tc
        $alreadyHaveCategory = @($categoryRows | Where-Object { $_.Model -eq "M$tm" -and $_.Category -eq "C$tc" }).Count -gt 0

        if (-not $alreadyHaveCategory) {
            $categoryRows.Add($categoryInfo)

            if ($categoryInfo.CataloguePath -match '(?i)\bup\s+to\s+\([^)]+\)\s+([A-Z]?\d+)') {
                $boundaries.Add([pscustomobject]@{
                    Model="M$tm"; Category="C$tc"; BoundaryType="DOMAIN_MAX"; Value=$Matches[1].Trim()
                    SourceKind="CATEGORY_HEADER"; Scope="CATEGORY"; Item=""; ApplicationId=""; RuleIndex=""
                    Raw=$categoryInfo.CataloguePath
                })
            }
        }

        $tree = Get-Tree $file.FullName
        $itemAttr = Join-Path $modelRoot "Itm_M$($tm)_C$($tc)_I$($ti)_attributes.xml"

        foreach ($row in $tree.Rows) {
            $f = $row.Fields
            if ($f.Count -lt 5) { continue }

            $partRef = 0
            [void][int]::TryParse(([string]$f[3]).Trim(), [ref]$partRef)
            $pn = ([string]$f[4]).Trim()

            if ($partRef -le 0 -or [string]::IsNullOrWhiteSpace($pn) -or $pn -eq "0") { continue }
            if ($PartNumber -and $pn -notlike "*$PartNumber*") { continue }

            $applicationId = ([string]$f[$f.Count - 1]).Trim()
            $pathNodes = @(Get-Path $tree.Nodes $row.Parent)
            $pathLabels = @($pathNodes | Where-Object {
                -not [string]::IsNullOrWhiteSpace($_.Label)
            } | ForEach-Object { [string]$_.Label })

            $topLabel = Get-TopLabel $tm $tc $ti

            $occurrences.Add([pscustomobject]@{
                Model="M$tm"
                Category="C$tc"
                Item="I$ti"
                PartNumber=$pn
                ApplicationId=$applicationId
                CataloguePath=$categoryInfo.CataloguePath
                TopLevelLabel=$topLabel
                ItemTreePath=($pathLabels -join " > ")
            })

            foreach ($label in $pathLabels) {
                foreach ($v in @(Parse-VinLabel $label)) {
                    if ($v.From) {
                        $boundaries.Add([pscustomobject]@{
                            Model="M$tm"; Category="C$tc"; BoundaryType="FROM"; Value=$v.From
                            SourceKind="TREE_TEXT"; Scope="ITEM_TREE"; Item="I$ti"; ApplicationId=$applicationId
                            RuleIndex=""; Raw=$v.Raw
                        })
                    }
                    if ($v.To) {
                        $boundaries.Add([pscustomobject]@{
                            Model="M$tm"; Category="C$tc"; BoundaryType="TO"; Value=$v.To
                            SourceKind="TREE_TEXT"; Scope="ITEM_TREE"; Item="I$ti"; ApplicationId=$applicationId
                            RuleIndex=""; Raw=$v.Raw
                        })
                    }
                }
            }

            $allRules = New-Object System.Collections.Generic.List[object]

            foreach ($rule in @(Get-Rules (Join-Path $Root "menus\pl_id_$($tm)_attributes.xml") ([string]$tc) "CATEGORY")) {
                $allRules.Add($rule)
            }
            foreach ($rule in @(Get-Rules (Join-Path $modelRoot "tl_M$($tm)_C$($tc)_attributes.xml") ([string]$ti) "TOP")) {
                $allRules.Add($rule)
            }
            foreach ($rule in @(Get-Rules $itemAttr $applicationId "APPLICATION")) {
                $allRules.Add($rule)
            }

            foreach ($rule in $allRules) {
                $rawRules.Add([pscustomobject]@{
                    Model="M$tm"; Category="C$tc"; Item="I$ti"; PartNumber=$pn; ApplicationId=$applicationId
                    Scope=$rule.Scope; RuleIndex=$rule.RuleIndex; RawRule=$rule.RawRule; SourceFile=$rule.SourceFile
                })

                $tuples = @(Parse-RuleTuples $rule.RawRule $rule.Scope $rule.RuleIndex)
                $aTuples = @($tuples | Where-Object { $_.Group -match '^A\d+$' })

                foreach ($tuple in $tuples) {
                    if ($tuple.Group -eq "C") {
                        $boundaryType = "UNKNOWN"
                        if ($tuple.Flag1 -eq "0") { $boundaryType = "FROM" }
                        elseif ($tuple.Flag1 -eq "1") { $boundaryType = "TO" }

                        $boundaries.Add([pscustomobject]@{
                            Model="M$tm"; Category="C$tc"; BoundaryType=$boundaryType; Value=$tuple.Value
                            SourceKind="ATTRIBUTE_C"; Scope=$tuple.Scope; Item="I$ti"; ApplicationId=$applicationId
                            RuleIndex=$tuple.RuleIndex; Raw=$tuple.Raw
                        })
                        continue
                    }

                    if ($tuple.Group -notmatch '^A\d+$') { continue }

                    $rawFilters.Add([pscustomobject]@{
                        Model="M$tm"; Category="C$tc"; Group=$tuple.Group; Value=$tuple.Value
                        Effect=(Get-Effect $tuple); Scope=$tuple.Scope; Item="I$ti"
                        ApplicationId=$applicationId; RuleIndex=$tuple.RuleIndex; SourceFile=$rule.SourceFile
                    })

                    $nonVinLabels = @($pathLabels | Where-Object {
                        @(Parse-VinLabel $_).Count -eq 0
                    } | Select-Object -Unique)

                    $candidate = ""
                    $status = "CONTEXT_ONLY"

                    if ($tuple.Scope -eq "APPLICATION" -and $aTuples.Count -eq 1 -and $nonVinLabels.Count -eq 1) {
                        $candidate = $nonVinLabels[0]
                        $status = "EXACT_SOURCE_JOIN"
                    }

                    $localDecodeEvidence.Add([pscustomobject]@{
                        Model="M$tm"; Category="C$tc"; Group=$tuple.Group; Value=$tuple.Value
                        CandidateLabel=$candidate; ResolutionStatus=$status; SourceFile=$rule.SourceFile
                    })
                }
            }
        }
    }
}

$filters = New-Object System.Collections.Generic.List[object]

foreach ($g in @($rawFilters | Group-Object Model,Category,Group,Value,Effect)) {
    $first = $g.Group[0]

    $localLabels = @($localDecodeEvidence | Where-Object {
        $_.Model -eq $first.Model -and
        $_.Category -eq $first.Category -and
        $_.Group -eq $first.Group -and
        $_.Value -eq $first.Value -and
        $_.ResolutionStatus -eq "EXACT_SOURCE_JOIN" -and
        -not [string]::IsNullOrWhiteSpace($_.CandidateLabel)
    } | Select-Object -ExpandProperty CandidateLabel -Unique)

    $label = ""
    $status = "UNRESOLVED"
    $resolutionSource = "LOCAL_CATEGORY"
    $discoveryHits = 0
    $discoveryExactJoins = 0
    $matchFiles = @($g.Group | Select-Object -ExpandProperty SourceFile -Unique | Where-Object { $_ } | Sort-Object)

    if ($localLabels.Count -eq 1) {
        $label = $localLabels[0]
        $status = "EXACT_LOCAL_JOIN"
    }
    elseif ($localLabels.Count -gt 1) {
        $status = "AMBIGUOUS"
    }
    else {
        $modelNumber = [int]($first.Model -replace '^M','')
        $discovered = Find-AttributeEvidenceInModel $modelNumber $first.Group $first.Value

        $discoveryHits = $discovered.HitCount
        $discoveryExactJoins = $discovered.ExactJoinCount
        $resolutionSource = $discovered.Source
        if ($discovered.MatchFiles) {
            $matchFiles = @(
                $matchFiles
                @($discovered.MatchFiles -split '\s+\|\s+')
            ) | Where-Object { $_ } | Sort-Object -Unique
        }

        if ($discovered.Status -eq "DISCOVERED_MODEL_SOURCE_JOIN") {
            $label = $discovered.Label
            $status = $discovered.Status
        }
        elseif ($discovered.Status -eq "AMBIGUOUS") {
            $status = "AMBIGUOUS"
        }
    }

    $scopes = @($g.Group | Select-Object -ExpandProperty Scope -Unique | Sort-Object)

    $filters.Add([pscustomobject]@{
        Model=$first.Model
        Category=$first.Category
        Group=$first.Group
        Value=$first.Value
        Label=$label
        Effect=$first.Effect
        Scopes=($scopes -join " | ")
        ResolutionStatus=$status
        ResolutionSource=$resolutionSource
        EvidenceCount=$g.Count
        DiscoveryHits=$discoveryHits
        DiscoveryExactJoins=$discoveryExactJoins
        MatchFiles=($matchFiles -join " | ")
    })
}

$boundarySummary = @($boundaries | Group-Object Model,Category,BoundaryType,Value,SourceKind,Scope | ForEach-Object {
    $first = $_.Group[0]
    [pscustomobject]@{
        Model=$first.Model
        Category=$first.Category
        BoundaryType=$first.BoundaryType
        Value=$first.Value
        SourceKind=$first.SourceKind
        Scope=$first.Scope
        Count=$_.Count
    }
} | Sort-Object Model,Category,Value,BoundaryType)

Write-Host ""
Write-Host "============================================================"
Write-Host "IMPORTER-ORIENTED SUMMARY"
Write-Host "============================================================"
Write-Host "Categories:          $($categoryRows.Count)"
Write-Host "Occurrences:         $($occurrences.Count)"
Write-Host "Normalized filters:  $($filters.Count)"
Write-Host "Raw rules:           $($rawRules.Count)"
Write-Host "VIN boundaries:      $($boundarySummary.Count)"
Write-Host ""

foreach ($categoryRow in $categoryRows) {
    Write-Host "Catalogue path:"
    Write-Host "  $($categoryRow.CataloguePath)"
}

if ($filters.Count -gt 0) {
    Write-Host ""
    Write-Host "Filters:"

    foreach ($filter in @($filters | Sort-Object Group,Value,Effect)) {
        $labelText = ""
        if ($filter.Label) { $labelText = " -> $($filter.Label)" }

        $filesText = ""
        if ($filter.MatchFiles) { $filesText = " {" + $filter.MatchFiles + "}" }

        Write-Host ("  " + $filter.Group + "=" + $filter.Value + " " + $filter.Effect + $labelText + " [" + $filter.ResolutionStatus + "]" + $filesText)
    }
}

if ($Inventory) {
    if ($ModelId -and $CategoryId) {
        $prefix = "M$($ModelId)_C$($CategoryId)"
    }
    else {
        $prefix = "PN_" + ($PartNumber -replace '[^A-Za-z0-9_-]','_')
    }

    $exports = @(
        @($categoryRows,    "$($prefix)_category.csv"),
        @($occurrences,     "$($prefix)_occurrences.csv"),
        @($filters,         "$($prefix)_filters.csv"),
        @($rawRules,        "$($prefix)_applicability_rules.csv"),
        @($boundarySummary, "$($prefix)_vin_boundaries.csv")
    )

    foreach ($export in $exports) {
        if ($export[0].Count -gt 0) {
            $export[0] | Export-Csv -LiteralPath (Join-Path $OutDir $export[1]) -NoTypeInformation -Encoding UTF8
        }
    }

    Write-Host ""
    Write-Host "Importer-oriented output written to:"
    Write-Host "  $OutDir"
}
