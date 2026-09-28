[CmdletBinding(PositionalBinding=$false)]
param(
    [string]$Root = "C:\Program Files\JEPC\applications\JEPC",
    [string]$Model,
    [string]$Category,
    [string]$PartNumber,
    [switch]$Inventory,
    [switch]$TraceFiles,
    [string]$OutDir = (Join-Path (Get-Location).Path "jepc-search")
)

$ErrorActionPreference = "Stop"
$script:FileCache = @{}

function Get-RelativeJepcPath {
    param([string]$Path)
    $rootFull = [IO.Path]::GetFullPath($Root).TrimEnd('\')
    $full = [IO.Path]::GetFullPath($Path)
    if ($full.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
        return $full.Substring($rootFull.Length).TrimStart('\')
    }
    return $full
}

function Read-JepcData {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return @() }

    $full = [IO.Path]::GetFullPath($Path)
    if ($script:FileCache.ContainsKey($full)) { return $script:FileCache[$full] }

    if ($TraceFiles) { Write-Host ("*** Reading " + (Get-RelativeJepcPath $full)) }

    $rows = @(Get-Content -LiteralPath $full | ForEach-Object {
        $x = $_.Trim()
        if ($x -and -not $x.StartsWith("<?xml") -and $x -ne "<Data>" -and $x -ne "</Data>") { $x }
    })

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

function Get-Tree {
    param([string]$Path)
    $nodes = @{}
    $rows = New-Object System.Collections.Generic.List[object]

    foreach ($line in Read-JepcData $Path) {
        $f = Split-JepcRow $line
        if ($null -eq $f -or $f.Count -lt 3) { continue }

        $row = [pscustomobject]@{
            Parent = [string]$f[0]
            Id = [string]$f[1]
            Description = [string]$f[2]
            Fields = $f
        }
        $rows.Add($row)
        $nodes[$row.Id] = $row
    }

    return [pscustomobject]@{ Nodes=$nodes; Rows=$rows }
}

function Get-TreePath {
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
        Model = "M$M"
        Category = "C$C"
        CataloguePath = $cataloguePath
        ImageRef = $imageRef
        SourceFile = (Get-RelativeJepcPath $path)
    }
}

function Get-TopDescription {
    param([int]$M, [int]$C, [int]$I)
    $path = Join-Path $Root "drilldown\pl_id_$M\L0\tl_M$($M)_C$($C)_L0.xml"
    if (-not (Test-Path -LiteralPath $path)) { return "" }

    foreach ($line in Read-JepcData $path) {
        $f = Split-JepcRow $line
        if ($null -ne $f -and $f.Count -ge 2 -and [string]$f[0] -eq [string]$I) { return [string]$f[1] }
    }
    return ""
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
            Scope = $Scope
            RuleIndex = $ruleIndex
            RawRule = $line.Substring($comma + 1).Trim()
            SourceFile = (Get-RelativeJepcPath $Path)
        })
    }
    return $result
}

function Parse-Predicates {
    param([string]$RawRule, [string]$Scope, [int]$RuleIndex)
    $result = New-Object System.Collections.Generic.List[object]
    $predicateIndex = 0

    foreach ($m in [regex]::Matches($RawRule, '\[(?<body>[^\]]+)\]')) {
        $parts = @($m.Groups["body"].Value.Split(",") | ForEach-Object { $_.Trim() })
        if ($parts.Count -lt 2) { continue }

        $predicateIndex++
        $flag1 = ""
        $flag2 = ""
        $flag3 = ""
        if ($parts.Count -ge 3) { $flag1 = [string]$parts[2] }
        if ($parts.Count -ge 4) { $flag2 = [string]$parts[3] }
        if ($parts.Count -ge 5) { $flag3 = [string]$parts[4] }

        $result.Add([pscustomobject]@{
            Scope = $Scope
            RuleIndex = $RuleIndex
            PredicateIndex = $predicateIndex
            Group = [string]$parts[0]
            Value = [string]$parts[1]
            Flag1 = $flag1
            Flag2 = $flag2
            Flag3 = $flag3
            RawPredicate = $m.Value
        })
    }
    return $result
}

function Parse-VinDescription {
    param([string]$Description)
    if ([string]::IsNullOrWhiteSpace($Description)) { return @() }

    $x = $Description.Trim()
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

function Get-CatalogueDisplaySegments {
    param([string]$CataloguePath)

    if ([string]::IsNullOrWhiteSpace($CataloguePath)) { return @() }

    # JEPC model text can itself contain "/", for example "XK8 Coupe/Convertible".
    # Do not let that presentation slash create a false catalogue hierarchy level.
    $displayPath = $CataloguePath -replace '(?i)Coupe/Convertible', 'Coupe Convertible'

    return @(
        $displayPath.Split("/") |
            ForEach-Object { $_.Trim() } |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )
}

function Get-FullDescriptionPath {
    param(
        [string]$CataloguePath,
        [string]$TopDescription,
        [string[]]$Descriptions
    )

    $parts = New-Object System.Collections.Generic.List[string]

    foreach ($segment in @(Get-CatalogueDisplaySegments $CataloguePath)) {
        $parts.Add($segment)
    }

    if (-not [string]::IsNullOrWhiteSpace($TopDescription)) {
        $parts.Add($TopDescription.Trim())
    }

    foreach ($description in @($Descriptions)) {
        if (-not [string]::IsNullOrWhiteSpace($description)) {
            $parts.Add($description.Trim())
        }
    }

    return ($parts -join " > ")
}

function Join-RawRules {
    param([object[]]$Rules)
    if ($null -eq $Rules -or $Rules.Count -eq 0) { return "" }
    return (@($Rules | ForEach-Object { "[" + $_.Scope + "] " + $_.RawRule }) -join " || ")
}

function Join-RawPredicates {
    param([object[]]$Rules)
    if ($null -eq $Rules -or $Rules.Count -eq 0) { return "" }

    $tokens = New-Object System.Collections.Generic.List[string]
    foreach ($rule in $Rules) {
        foreach ($predicate in @(Parse-Predicates $rule.RawRule $rule.Scope $rule.RuleIndex)) {
            $tokens.Add($predicate.RawPredicate)
        }
    }
    return ($tokens -join "")
}

function Add-VinBoundary {
    param(
        [System.Collections.Generic.List[object]]$List,
        [string]$ModelValue,
        [string]$CategoryValue,
        [string]$BoundaryType,
        [string]$Value,
        [string]$SourceKind,
        [string]$Scope,
        [string]$Item,
        [string]$ApplicationId,
        [string]$Raw,
        [string]$SourceFile
    )

    if ([string]::IsNullOrWhiteSpace($Value)) { return }

    $List.Add([pscustomobject]@{
        Model = $ModelValue
        Category = $CategoryValue
        BoundaryType = $BoundaryType
        Value = $Value
        SourceKind = $SourceKind
        Scope = $Scope
        Item = $Item
        ApplicationId = $ApplicationId
        Raw = $Raw
        SourceFile = $SourceFile
    })
}

if (($Model -and -not $Category) -or ($Category -and -not $Model)) { throw "-Model and -Category must be supplied together." }
if (-not (($Model -and $Category) -or $PartNumber)) { throw "Use (-Model NNNN -Category MMMM) or -PartNumber PPPP." }
if (-not (Test-Path -LiteralPath $Root)) { throw "JEPC root not found: $Root" }

$ModelId = $null
$CategoryId = $null

if ($Model -and $Category) {
    if ($Model -notmatch '^M?(\d+)$') { throw "Invalid -Model '$Model'." }
    $ModelId = [int]$Matches[1]

    if ($Category -notmatch '^C?(\d+)$') { throw "Invalid -Category '$Category'." }
    $CategoryId = [int]$Matches[1]
}

$categoryRows = New-Object System.Collections.Generic.List[object]
$occurrences = New-Object System.Collections.Generic.List[object]
$ruleRows = New-Object System.Collections.Generic.List[object]
$predicateRows = New-Object System.Collections.Generic.List[object]
$vinBoundaries = New-Object System.Collections.Generic.List[object]
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

    if ($ModelId -eq $m) { $itemPattern = "Itm_M$($m)_C$($CategoryId)_I*_L0.xml" }
    else { $itemPattern = "Itm_M$($m)_C*_I*_L0.xml" }

    $itemFiles = @(Get-ChildItem -LiteralPath $l0Root -File | Where-Object { $_.Name -like $itemPattern } | Sort-Object Name)

    foreach ($file in $itemFiles) {
        if ($file.Name -notmatch '^Itm_M(\d+)_C(\d+)_I(\d+)_L0\.xml$') { continue }

        $tm = [int]$Matches[1]
        $tc = [int]$Matches[2]
        $ti = [int]$Matches[3]

        $modelName = "M$tm"
        $categoryName = "C$tc"
        $itemName = "I$ti"
        $categoryInfo = Get-CategoryInfo $tm $tc

        $alreadyHaveCategory = @($categoryRows | Where-Object { $_.Model -eq $modelName -and $_.Category -eq $categoryName }).Count -gt 0
        if (-not $alreadyHaveCategory) {
            $categoryRows.Add($categoryInfo)
            if ($categoryInfo.CataloguePath -match '(?i)\bup\s+to\s+\([^)]+\)\s+([A-Z]?\d+)') {
                Add-VinBoundary $vinBoundaries $modelName $categoryName "DOMAIN_MAX" $Matches[1].Trim() "CATEGORY_HEADER" "CATEGORY" "" "" $categoryInfo.CataloguePath $categoryInfo.SourceFile
            }
        }

        $tree = Get-Tree $file.FullName
        $itemAttributePath = Join-Path $modelRoot "Itm_M$($tm)_C$($tc)_I$($ti)_attributes.xml"
        $topAttributePath = Join-Path $modelRoot "tl_M$($tm)_C$($tc)_attributes.xml"
        $categoryAttributePath = Join-Path $Root "menus\pl_id_$($tm)_attributes.xml"

        foreach ($row in $tree.Rows) {
            $f = $row.Fields
            if ($f.Count -lt 5) { continue }

            $catEntryId = 0
            [void][int]::TryParse(([string]$f[3]).Trim(), [ref]$catEntryId)
            $pn = ([string]$f[4]).Trim()

            if ($catEntryId -le 0 -or [string]::IsNullOrWhiteSpace($pn) -or $pn -eq "0") { continue }
            if ($PartNumber -and $pn -notlike "*$PartNumber*") { continue }

            $applicationId = ([string]$f[$f.Count - 1]).Trim()
            $pathNodes = @(Get-TreePath $tree.Nodes $row.Parent)
            $descriptions = @($pathNodes | Where-Object { -not [string]::IsNullOrWhiteSpace($_.Description) } | ForEach-Object { [string]$_.Description })
            $topDescription = Get-TopDescription $tm $tc $ti

            $categoryRules = @(Get-Rules $categoryAttributePath ([string]$tc) "CATEGORY")
            $topRules = @(Get-Rules $topAttributePath ([string]$ti) "TOP")
            $applicationRules = @(Get-Rules $itemAttributePath $applicationId "APPLICATION")
            $allRules = @($categoryRules + $topRules + $applicationRules)

            $occurrences.Add([pscustomobject]@{
                Model = $modelName
                Category = $categoryName
                Item = $itemName
                PartNumber = $pn
                CatEntryId = $catEntryId
                ApplicationId = $applicationId
                CataloguePath = $categoryInfo.CataloguePath
                TopDescription = $topDescription
                DescriptionPath = ($descriptions -join " > ")
                FullDescriptionPath = (Get-FullDescriptionPath $categoryInfo.CataloguePath $topDescription $descriptions)
                RawPredicates = (Join-RawPredicates $allRules)
                RawRules = (Join-RawRules $allRules)
                TreeSource = (Get-RelativeJepcPath $file.FullName)
                ApplicationAttributeSource = $(if (Test-Path -LiteralPath $itemAttributePath) { Get-RelativeJepcPath $itemAttributePath } else { "" })
                TopAttributeSource = $(if (Test-Path -LiteralPath $topAttributePath) { Get-RelativeJepcPath $topAttributePath } else { "" })
                CategoryAttributeSource = $(if (Test-Path -LiteralPath $categoryAttributePath) { Get-RelativeJepcPath $categoryAttributePath } else { "" })
            })

            foreach ($description in $descriptions) {
                foreach ($v in @(Parse-VinDescription $description)) {
                    if ($v.From) { Add-VinBoundary $vinBoundaries $modelName $categoryName "FROM" $v.From "TREE_DESCRIPTION" "ITEM_TREE" $itemName $applicationId $v.Raw (Get-RelativeJepcPath $file.FullName) }
                    if ($v.To) { Add-VinBoundary $vinBoundaries $modelName $categoryName "TO" $v.To "TREE_DESCRIPTION" "ITEM_TREE" $itemName $applicationId $v.Raw (Get-RelativeJepcPath $file.FullName) }
                }
            }

            foreach ($rule in $allRules) {
                $ruleRows.Add([pscustomobject]@{
                    Model = $modelName
                    Category = $categoryName
                    Item = $itemName
                    PartNumber = $pn
                    ApplicationId = $applicationId
                    Scope = $rule.Scope
                    RuleIndex = $rule.RuleIndex
                    RawRule = $rule.RawRule
                    SourceFile = $rule.SourceFile
                })

                foreach ($predicate in @(Parse-Predicates $rule.RawRule $rule.Scope $rule.RuleIndex)) {
                    $predicateRows.Add([pscustomobject]@{
                        Model = $modelName
                        Category = $categoryName
                        Item = $itemName
                        PartNumber = $pn
                        ApplicationId = $applicationId
                        Scope = $predicate.Scope
                        RuleIndex = $predicate.RuleIndex
                        PredicateIndex = $predicate.PredicateIndex
                        Group = $predicate.Group
                        Value = $predicate.Value
                        Flag1 = $predicate.Flag1
                        Flag2 = $predicate.Flag2
                        Flag3 = $predicate.Flag3
                        RawPredicate = $predicate.RawPredicate
                        SourceFile = $rule.SourceFile
                    })

                    if ($predicate.Group -eq "C") {
                        $boundaryType = "RAW"
                        if ($predicate.Flag1 -eq "0") { $boundaryType = "FROM" }
                        elseif ($predicate.Flag1 -eq "1") { $boundaryType = "TO" }
                        Add-VinBoundary $vinBoundaries $modelName $categoryName $boundaryType $predicate.Value "ATTRIBUTE_PREDICATE" $predicate.Scope $itemName $applicationId $predicate.RawPredicate $rule.SourceFile
                    }
                }
            }
        }
    }
}

$ruleRows = @($ruleRows | Sort-Object Model,Category,Item,PartNumber,ApplicationId,Scope,RuleIndex -Unique)
$predicateRows = @($predicateRows | Sort-Object Model,Category,Item,PartNumber,ApplicationId,Scope,RuleIndex,PredicateIndex -Unique)

$vinBoundarySummary = @($vinBoundaries | Group-Object Model,Category,BoundaryType,Value,SourceKind,Scope | ForEach-Object {
    $first = $_.Group[0]
    [pscustomobject]@{
        Model = $first.Model
        Category = $first.Category
        BoundaryType = $first.BoundaryType
        Value = $first.Value
        SourceKind = $first.SourceKind
        Scope = $first.Scope
        Count = $_.Count
    }
} | Sort-Object Model,Category,Value,BoundaryType)

$descriptionFilterRows = @(
    foreach ($occurrence in $occurrences) {
        if ([string]::IsNullOrWhiteSpace($occurrence.DescriptionPath)) { continue }

        foreach ($description in @($occurrence.DescriptionPath.Split(">") | ForEach-Object { $_.Trim() })) {
            if ([string]::IsNullOrWhiteSpace($description)) { continue }

            $vin = @(Parse-VinDescription $description)
            $isVin = ($vin.Count -gt 0)

            [pscustomobject]@{
                Description = $description
                IsVin = $isVin
                Model = $occurrence.Model
                Category = $occurrence.Category
                Item = $occurrence.Item
                PartNumber = $occurrence.PartNumber
                ApplicationId = $occurrence.ApplicationId
            }
        }
    }
)

$descriptionFilterSummary = @(
    $descriptionFilterRows |
        Group-Object Description,IsVin |
        ForEach-Object {
            $first = $_.Group[0]
            [pscustomobject]@{
                Description = $first.Description
                IsVin = $first.IsVin
                OccurrenceCount = $_.Count
                PartCount = @($_.Group | Select-Object -ExpandProperty PartNumber -Unique).Count
            }
        } |
        Sort-Object IsVin,Description
)

$vinRangeRows = @(
    foreach ($row in $descriptionFilterRows | Where-Object { $_.IsVin }) {
        foreach ($vin in @(Parse-VinDescription $row.Description)) {
            [pscustomobject]@{
                Description = $row.Description
                From = $vin.From
                To = $vin.To
                Model = $row.Model
                Category = $row.Category
                Item = $row.Item
                PartNumber = $row.PartNumber
                ApplicationId = $row.ApplicationId
            }
        }
    }
)

$vinRangeSummary = @(
    $vinRangeRows |
        Group-Object Description,From,To |
        ForEach-Object {
            $first = $_.Group[0]
            [pscustomobject]@{
                Description = $first.Description
                From = $first.From
                To = $first.To
                OccurrenceCount = $_.Count
                PartCount = @($_.Group | Select-Object -ExpandProperty PartNumber -Unique).Count
            }
        } |
        Sort-Object From,To,Description
)

$summaryLines = New-Object System.Collections.Generic.List[string]
$summaryLines.Add("============================================================")
$summaryLines.Add("JEPC X100 SEARCH FINDINGS")
$summaryLines.Add("============================================================")
if ($PartNumber) { $summaryLines.Add("Search: $PartNumber") }
elseif ($ModelId -and $CategoryId) { $summaryLines.Add("Search: M$($ModelId) / C$($CategoryId)") }
$summaryLines.Add("Occurrences: $($occurrences.Count)")
$summaryLines.Add("Raw rules:   $($ruleRows.Count)")
$summaryLines.Add("Predicates:  $($predicateRows.Count)")
$summaryLines.Add("Descriptions/filter candidates: $($descriptionFilterSummary.Count)")
$summaryLines.Add("VIN description ranges:         $($vinRangeSummary.Count)")
$summaryLines.Add("")

if ($PartNumber) {
    $occurrenceNo = 0
    foreach ($occurrence in @($occurrences | Sort-Object Model,Category,Item,PartNumber,ApplicationId)) {
        $occurrenceNo++
        $summaryLines.Add("Occurrence $occurrenceNo")
        foreach ($segment in @($occurrence.FullDescriptionPath.Split(">") | ForEach-Object { $_.Trim() })) {
            if (-not [string]::IsNullOrWhiteSpace($segment)) { $summaryLines.Add("> $segment") }
        }
        $summaryLines.Add("> $($occurrence.PartNumber)")
        $summaryLines.Add("")
        $summaryLines.Add("applicationId: $($occurrence.ApplicationId)")

        $matchingPredicates = @($predicateRows | Where-Object {
            $_.Model -eq $occurrence.Model -and
            $_.Category -eq $occurrence.Category -and
            $_.Item -eq $occurrence.Item -and
            $_.PartNumber -eq $occurrence.PartNumber -and
            $_.ApplicationId -eq $occurrence.ApplicationId
        } | Sort-Object Scope,RuleIndex,PredicateIndex)

        if ($matchingPredicates.Count -gt 0) {
            $summaryLines.Add("predicates:")
            foreach ($predicate in $matchingPredicates) {
                $summaryLines.Add("  $($predicate.RawPredicate)")
            }
        }

        $summaryLines.Add("sources:")
        $summaryLines.Add("  tree: $($occurrence.TreeSource)")
        if ($occurrence.ApplicationAttributeSource) { $summaryLines.Add("  application attributes: $($occurrence.ApplicationAttributeSource)") }
        if ($occurrence.TopAttributeSource) { $summaryLines.Add("  top attributes: $($occurrence.TopAttributeSource)") }
        if ($occurrence.CategoryAttributeSource) { $summaryLines.Add("  category attributes: $($occurrence.CategoryAttributeSource)") }
        $summaryLines.Add("")
    }
}
else {
    foreach ($categoryRow in @($categoryRows | Sort-Object Model,Category)) {
        $categoryOccurrences = @($occurrences | Where-Object {
            $_.Model -eq $categoryRow.Model -and $_.Category -eq $categoryRow.Category
        })

        foreach ($segment in @(Get-CatalogueDisplaySegments $categoryRow.CataloguePath)) {
            $summaryLines.Add("> $segment")
        }

        foreach ($topGroup in @($categoryOccurrences | Group-Object TopDescription | Sort-Object Name)) {
            if (-not [string]::IsNullOrWhiteSpace($topGroup.Name)) { $summaryLines.Add("> $($topGroup.Name)") }
            foreach ($pn in @($topGroup.Group | Select-Object -ExpandProperty PartNumber -Unique | Sort-Object)) {
                $summaryLines.Add("  $pn")
            }
            $summaryLines.Add("")
        }
    }

    $summaryLines.Add("Occurrence paths:")
    $summaryLines.Add("")
    foreach ($occurrence in @($occurrences | Sort-Object TopDescription,DescriptionPath,PartNumber,ApplicationId)) {
        $summaryLines.Add("$($occurrence.FullDescriptionPath) > $($occurrence.PartNumber)")
    }
}

$summaryLines.Add("")
$summaryLines.Add("VIN descriptions / ranges:")
$summaryLines.Add(("{0,-48} {1,-20} {2,11} {3,7}" -f "Description","Range","Occurrences","Parts"))
$summaryLines.Add(("{0,-48} {1,-20} {2,11} {3,7}" -f ("-" * 48),("-" * 20),("-" * 11),("-" * 7)))
if ($vinRangeSummary.Count -eq 0) {
    $summaryLines.Add("(none)")
}
else {
    foreach ($range in $vinRangeSummary) {
        $normalized = ""
        if ($range.From -and $range.To) { $normalized = "$($range.From)..$($range.To)" }
        elseif ($range.From) { $normalized = "$($range.From).." }
        elseif ($range.To) { $normalized = "..$($range.To)" }
        $summaryLines.Add(("{0,-48} {1,-20} {2,11} {3,7}" -f $range.Description,$normalized,$range.OccurrenceCount,$range.PartCount))
    }
}

$summaryLines.Add("")
$summaryLines.Add("Descriptions / filter candidates:")
$summaryLines.Add(("{0,-32} {1,11} {2,7}" -f "Description","Occurrences","Parts"))
$summaryLines.Add(("{0,-32} {1,11} {2,7}" -f ("-" * 32),("-" * 11),("-" * 7)))
foreach ($filter in @($descriptionFilterSummary | Where-Object { -not $_.IsVin })) {
    $summaryLines.Add(("{0,-32} {1,11} {2,7}" -f $filter.Description,$filter.OccurrenceCount,$filter.PartCount))
}
$summaryLines.Add("")

foreach ($line in $summaryLines) { Write-Host $line }

if ($Inventory) {
    New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

    if ($ModelId -and $CategoryId) { $prefix = "M$($ModelId)_C$($CategoryId)" }
    else { $prefix = "PN_" + ($PartNumber -replace '[^A-Za-z0-9_-]','_') }

    $exports = @(
        @($categoryRows,       "$($prefix)_category.csv"),
        @($occurrences,        "$($prefix)_occurrences.csv"),
        @($ruleRows,           "$($prefix)_applicability_rules.csv"),
        @($predicateRows,             "$($prefix)_predicates.csv"),
        @($descriptionFilterSummary,  "$($prefix)_descriptions.csv"),
        @($vinRangeSummary,           "$($prefix)_vin_ranges.csv"),
        @($vinBoundarySummary,        "$($prefix)_vin_boundaries.csv")
    )

    foreach ($export in $exports) {
        if ($export[0].Count -gt 0) {
            $export[0] | Export-Csv -LiteralPath (Join-Path $OutDir $export[1]) -NoTypeInformation -Encoding UTF8
        }
    }

    $findingsPath = Join-Path $OutDir "$($prefix)_findings.txt"
    $summaryLines | Set-Content -LiteralPath $findingsPath -Encoding UTF8

    Write-Host ""
    Write-Host "Output written to:"
    Write-Host ("  " + $OutDir)
    Write-Host ""
    Write-Host "Files:"
    Write-Host ("  $($prefix)_findings.txt")
    Write-Host ("  $($prefix)_category.csv")
    Write-Host ("  $($prefix)_occurrences.csv")
    Write-Host ("  $($prefix)_applicability_rules.csv")
    Write-Host ("  $($prefix)_predicates.csv")
    Write-Host ("  $($prefix)_descriptions.csv")
    Write-Host ("  $($prefix)_vin_ranges.csv")
    Write-Host ("  $($prefix)_vin_boundaries.csv")
}
