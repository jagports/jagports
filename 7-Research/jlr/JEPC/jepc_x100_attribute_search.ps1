[CmdletBinding(PositionalBinding=$false)]
param(
  [string]$Root="C:\Program Files\JEPC\applications\JEPC",
  [string]$Model,
  [string]$Category,
  [string]$PartNumber,
  [switch]$Inventory,
  [string]$OutDir=(Join-Path (Get-Location).Path "jepc-applicability")
)

$ErrorActionPreference="Stop"
$cache=@{}

function Read-Data([string]$Path){
  if(-not(Test-Path -LiteralPath $Path)){return @()}
  $full=[IO.Path]::GetFullPath($Path)
  if($cache.ContainsKey($full)){return $cache[$full]}
  Write-Host ""
  Write-Host "*** Reading $full"
  $rows=@(Get-Content -LiteralPath $full|ForEach-Object{
    $x=$_.Trim()
    if($x -and -not $x.StartsWith("<?xml") -and $x -ne "<Data>" -and $x -ne "</Data>"){$x}
  })
  Write-Host "    $($rows.Count) data rows"
  $cache[$full]=$rows
  return $rows
}

function Split-Row([string]$Line){
  if(-not $Line.StartsWith("[") -or -not $Line.EndsWith("]")){return $null}
  $s=$Line.Substring(1,$Line.Length-2)
  $out=New-Object System.Collections.Generic.List[string]
  $buf=New-Object Text.StringBuilder
  $quoted=$false
  for($i=0;$i -lt $s.Length;$i++){
    $c=$s[$i]
    if($c -eq "'"){$quoted=-not $quoted;continue}
    if($c -eq "," -and -not $quoted){$out.Add($buf.ToString().Trim());$buf.Clear()|Out-Null;continue}
    [void]$buf.Append($c)
  }
  $out.Add($buf.ToString().Trim())
  return ,$out.ToArray()
}

function Parse-VinLabel([string]$Label){
  if([string]::IsNullOrWhiteSpace($Label)){return @()}
  $x=$Label.Trim()
  if($x -match '(?i)^From\s+VIN\s*\(([^)]+)\)\s*To\s+VIN\s*\(([^)]+)\)$'){
    return ,([pscustomobject]@{From=$Matches[1].Trim();To=$Matches[2].Trim();Raw=$x})
  }
  if($x -match '(?i)^From\s+VIN\s*\(([^)]+)\)$'){
    return ,([pscustomobject]@{From=$Matches[1].Trim();To="";Raw=$x})
  }
  if($x -match '(?i)^To\s+VIN\s*\(([^)]+)\)$'){
    return ,([pscustomobject]@{From="";To=$Matches[1].Trim();Raw=$x})
  }
  return @()
}

function Parse-Tuples([string]$Raw,[string]$Scope,[int]$RuleIndex){
  $out=New-Object System.Collections.Generic.List[object]
  $i=0
  foreach($m in [regex]::Matches($Raw,'\[(?<g>A\d+|C)\s*,\s*(?<v>[^,\]]+)\s*,\s*(?<f1>[^,\]]+)\s*,\s*(?<f2>[^,\]]+)(?:\s*,\s*(?<f3>[^,\]]+))?\]')){
    $i++
    $out.Add([pscustomobject]@{
      Scope=$Scope;RuleIndex=$RuleIndex;TupleIndex=$i
      Group=$m.Groups["g"].Value.Trim();Value=$m.Groups["v"].Value.Trim()
      Flag1=$m.Groups["f1"].Value.Trim();Flag2=$m.Groups["f2"].Value.Trim()
      Flag3=$m.Groups["f3"].Value.Trim();Raw=$m.Value
    })
  }
  return $out
}

function Get-Rules([string]$Path,[string]$Key,[string]$Scope){
  $out=New-Object System.Collections.Generic.List[object]
  if(-not(Test-Path -LiteralPath $Path)){return $out}
  $n=0
  foreach($line in Read-Data $Path){
    $p=$line.IndexOf(",")
    if($p -lt 1){continue}
    if($line.Substring(0,$p).Trim() -ne $Key){continue}
    $n++
    $out.Add([pscustomobject]@{Scope=$Scope;RuleIndex=$n;RawRule=$line.Substring($p+1).Trim()})
  }
  return $out
}

function Get-Tree([string]$Path){
  $nodes=@{};$children=@{};$rows=New-Object System.Collections.Generic.List[object]
  foreach($line in Read-Data $Path){
    $f=Split-Row $line
    if($null -eq $f -or $f.Count -lt 3){continue}
    $r=[pscustomobject]@{Parent=[string]$f[0];Id=[string]$f[1];Label=[string]$f[2];Fields=$f}
    $rows.Add($r);$nodes[$r.Id]=$r
    if(-not $children.ContainsKey($r.Parent)){$children[$r.Parent]=New-Object System.Collections.Generic.List[object]}
    $children[$r.Parent].Add($r)
  }
  return [pscustomobject]@{Nodes=$nodes;Children=$children;Rows=$rows}
}

function Get-Path([hashtable]$Nodes,[string]$Parent){
  $rev=New-Object System.Collections.Generic.List[object];$guard=0
  while($Nodes.ContainsKey($Parent) -and $guard -lt 100){
    $r=$Nodes[$Parent];$rev.Add($r);$Parent=$r.Parent;$guard++
  }
  $out=New-Object System.Collections.Generic.List[object]
  for($i=$rev.Count-1;$i -ge 0;$i--){$out.Add($rev[$i])}
  return $out
}

if(($Model -and -not $Category) -or ($Category -and -not $Model)){throw "-Model and -Category must be supplied together."}
if(-not(($Model -and $Category) -or $PartNumber)){throw "Use (-Model NNNN -Category MMMM) or -PartNumber PPPP."}

$ModelId=$null;$CategoryId=$null
if($Model -and $Category){
  if($Model -notmatch '^M?(\d+)$'){throw "Invalid model"};$ModelId=[int]$Matches[1]
  if($Category -notmatch '^C?(\d+)$'){throw "Invalid category"};$CategoryId=[int]$Matches[1]
}
if(-not(Test-Path -LiteralPath $Root)){throw "JEPC root not found: $Root"}
if($Inventory){New-Item -ItemType Directory -Force -Path $OutDir|Out-Null}

$occ=New-Object System.Collections.Generic.List[object]
$paths=New-Object System.Collections.Generic.List[object]
$rules=New-Object System.Collections.Generic.List[object]
$pred=New-Object System.Collections.Generic.List[object]
$bounds=New-Object System.Collections.Generic.List[object]
$filter=New-Object System.Collections.Generic.List[object]
$families=New-Object System.Collections.Generic.List[object]
$vinFamilies=New-Object System.Collections.Generic.List[object]
$decode=New-Object System.Collections.Generic.List[object]

$modelIds=New-Object System.Collections.Generic.List[int]
if($PartNumber){
  Get-ChildItem -LiteralPath (Join-Path $Root "drilldown") -Directory|ForEach-Object{
    if($_.Name -match '^pl_id_(\d+)$'){$modelIds.Add([int]$Matches[1])}
  }
}else{$modelIds.Add($ModelId)}

foreach($m in $modelIds){
  $modelRoot=Join-Path $Root "drilldown\pl_id_$m"
  $l0=Join-Path $modelRoot "L0"
  if(-not(Test-Path -LiteralPath $l0)){continue}
  if($ModelId -eq $m){$pattern="Itm_M$($m)_C$($CategoryId)_I*_L0.xml"}else{$pattern="Itm_M$($m)_C*_I*_L0.xml"}

  foreach($file in @(Get-ChildItem -LiteralPath $l0 -File|Where-Object{$_.Name -like $pattern}|Sort-Object Name)){
    if($file.Name -notmatch '^Itm_M(\d+)_C(\d+)_I(\d+)_L0\.xml$'){continue}
    $tm=[int]$Matches[1];$tc=[int]$Matches[2];$ti=[int]$Matches[3]
    $tree=Get-Tree $file.FullName

    foreach($parent in $tree.Children.Keys){
      $kids=@($tree.Children[$parent]|Where-Object{-not [string]::IsNullOrWhiteSpace($_.Label)})
      if($kids.Count -lt 2){continue}
      $fid="M$($tm)_C$($tc)_I$($ti)_P$($parent)"
      $vinCount=0
      foreach($k in $kids){
        $isVin=(@(Parse-VinLabel $k.Label).Count -gt 0)
        if($isVin){$vinCount++}
        $filter.Add([pscustomobject]@{
          Model="M$tm";Category="C$tc";Item="I$ti";FamilyId=$fid;ParentNodeId=$parent
          ValueNodeId=$k.Id;RawLabel=$k.Label;IsVinExpression=$isVin;SiblingCount=$kids.Count
        })
      }
      $families.Add([pscustomobject]@{
        Model="M$tm";Category="C$tc";Item="I$ti";FamilyId=$fid;ParentNodeId=$parent
        BranchCount=$kids.Count;VinExpressionCount=$vinCount
        Labels=(@($kids|ForEach-Object{$_.Label}) -join " | ")
      })
      if($vinCount -ge 2){
        foreach($k in $kids){
          foreach($v in @(Parse-VinLabel $k.Label)){
            $vinFamilies.Add([pscustomobject]@{
              Model="M$tm";Category="C$tc";Item="I$ti";FamilyId=$fid;ParentNodeId=$parent
              NodeId=$k.Id;RawLabel=$k.Label;LowerValue=$v.From;UpperValue=$v.To
              SourceKind="TREE_SIBLING_FAMILY"
            })
          }
        }
      }
    }

    foreach($r in $tree.Rows){
      foreach($v in @(Parse-VinLabel $r.Label)){
        if($v.From){$bounds.Add([pscustomobject]@{Model="M$tm";Category="C$tc";BoundaryType="FROM";Value=$v.From;SourceKind="TREE_TEXT";Scope="ITEM_TREE";Item="I$ti";ApplicationId="";RuleIndex="";Raw=$v.Raw})}
        if($v.To){$bounds.Add([pscustomobject]@{Model="M$tm";Category="C$tc";BoundaryType="TO";Value=$v.To;SourceKind="TREE_TEXT";Scope="ITEM_TREE";Item="I$ti";ApplicationId="";RuleIndex="";Raw=$v.Raw})}
      }
    }

    $attr=Join-Path $modelRoot "Itm_M$($tm)_C$($tc)_I$($ti)_attributes.xml"

    foreach($r in $tree.Rows){
      $f=$r.Fields
      if($f.Count -lt 12){continue}
      $partRef=0;[void][int]::TryParse(([string]$f[3]).Trim(),[ref]$partRef)
      $pn=([string]$f[4]).Trim()
      if($partRef -le 0 -or -not $pn -or $pn -eq "0"){continue}
      if($PartNumber -and $pn -notlike "*$PartNumber*"){continue}

      $app=([string]$f[$f.Count-1]).Trim()
      $pathNodes=@(Get-Path $tree.Nodes $r.Parent)
      $labels=@($pathNodes|Where-Object{$_.Label}|ForEach-Object{$_.Label})
      $occ.Add([pscustomobject]@{Model="M$tm";Category="C$tc";Item="I$ti";PartNumber=$pn;ApplicationId=$app;ItemTreePath=($labels -join " > ")})

      $d=0
      foreach($p in $pathNodes){
        if($p.Label){
          $paths.Add([pscustomobject]@{Model="M$tm";Category="C$tc";Item="I$ti";PartNumber=$pn;ApplicationId=$app;Depth=$d;ParentNodeId=$p.Parent;NodeId=$p.Id;RawLabel=$p.Label})
          $d++
        }
      }

      $allRules=New-Object System.Collections.Generic.List[object]
      foreach($x in @(Get-Rules (Join-Path $Root "menus\pl_id_$($tm)_attributes.xml") ([string]$tc) "CATEGORY")){$allRules.Add($x)}
      foreach($x in @(Get-Rules (Join-Path $modelRoot "tl_M$($tm)_C$($tc)_attributes.xml") ([string]$ti) "TOP")){$allRules.Add($x)}
      foreach($x in @(Get-Rules $attr $app "APPLICATION")){$allRules.Add($x)}

      foreach($rule in $allRules){
        $rules.Add([pscustomobject]@{Model="M$tm";Category="C$tc";Item="I$ti";PartNumber=$pn;ApplicationId=$app;Scope=$rule.Scope;RuleIndex=$rule.RuleIndex;RawRule=$rule.RawRule})
        $tuples=@(Parse-Tuples $rule.RawRule $rule.Scope $rule.RuleIndex)
        $a=@($tuples|Where-Object{$_.Group -match '^A\d+$'})
        foreach($t in $tuples){
          $pred.Add([pscustomobject]@{Model="M$tm";Category="C$tc";Item="I$ti";PartNumber=$pn;ApplicationId=$app;Scope=$t.Scope;RuleIndex=$t.RuleIndex;TupleIndex=$t.TupleIndex;Group=$t.Group;Value=$t.Value;Flag1=$t.Flag1;Flag2=$t.Flag2;Flag3=$t.Flag3;Raw=$t.Raw})
          if($t.Group -eq "C"){
            if($t.Flag1 -eq "0"){$bt="FROM"}elseif($t.Flag1 -eq "1"){$bt="TO"}else{$bt="UNKNOWN"}
            $bounds.Add([pscustomobject]@{Model="M$tm";Category="C$tc";BoundaryType=$bt;Value=$t.Value;SourceKind="ATTRIBUTE_C";Scope=$t.Scope;Item="I$ti";ApplicationId=$app;RuleIndex=$t.RuleIndex;Raw=$t.Raw})
          }
          if($t.Group -match '^A\d+$'){
            $clean=@($labels|Where-Object{@(Parse-VinLabel $_).Count -eq 0})
            $candidate="";$status="AMBIGUOUS_PATH"
            if($a.Count -eq 1 -and $clean.Count -eq 1){$candidate=$clean[0];$status="EXACT_SINGLETON_PATH"}
            $decode.Add([pscustomobject]@{
              Group=$t.Group;Value=$t.Value;Model="M$tm";Category="C$tc";Item="I$ti"
              PartNumber=$pn;ApplicationId=$app;Scope=$t.Scope;RuleIndex=$t.RuleIndex
              FullTreePath=($clean -join " > ");CandidateLabel=$candidate
              EvidenceStatus=$status;RawPredicate=$t.Raw
            })
          }
        }
      }
    }
  }
}

$decodeSummary=New-Object System.Collections.Generic.List[object]
foreach($g in @($decode|Group-Object Group,Value)){
  $first=$g.Group[0]
  $c=@($g.Group|Where-Object{$_.EvidenceStatus -eq "EXACT_SINGLETON_PATH" -and $_.CandidateLabel}|Select-Object -ExpandProperty CandidateLabel -Unique)
  $label="";$status="CONTEXT_ONLY"
  if($c.Count -eq 1){$label=$c[0];$status="EXACT_SOURCE_JOIN"}elseif($c.Count -gt 1){$status="AMBIGUOUS"}
  $decodeSummary.Add([pscustomobject]@{Group=$first.Group;Value=$first.Value;ResolvedLabel=$label;ResolutionStatus=$status;EvidenceCount=$g.Group.Count;Candidates=($c -join " | ")})
}

Write-Host ""
Write-Host "Occurrences:              $($occ.Count)"
Write-Host "Applicability rules:      $($rules.Count)"
Write-Host "Predicates:               $($pred.Count)"
Write-Host "VIN boundary facts:       $($bounds.Count)"
Write-Host "Tree filter candidates:   $($filter.Count)"
Write-Host "Tree branch families:     $($families.Count)"
Write-Host "Structural VIN families:  $($vinFamilies.Count)"
Write-Host "Decode evidence:          $($decode.Count)"

if($Inventory){
  if($ModelId -and $CategoryId){$prefix="M$($ModelId)_C$($CategoryId)"}else{$prefix="PN_"+($PartNumber -replace '[^A-Za-z0-9_-]','_')}
  foreach($old in @("$($prefix)_occurrence_vin_bands.csv","$($prefix)_tree_filter_families.csv","$($prefix)_vin_bands.csv")){
    $p=Join-Path $OutDir $old
    if(Test-Path -LiteralPath $p){Remove-Item -LiteralPath $p -Force}
  }
  $exports=@(
    @($occ,"$($prefix)_occurrences.csv"),
    @($paths,"$($prefix)_path_steps.csv"),
    @($rules,"$($prefix)_applicability_rules.csv"),
    @($pred,"$($prefix)_applicability_predicates.csv"),
    @($bounds,"$($prefix)_vin_boundaries.csv"),
    @($filter,"$($prefix)_tree_filter_candidates.csv"),
    @($families,"$($prefix)_tree_branch_families.csv"),
    @($vinFamilies,"$($prefix)_structural_vin_families.csv"),
    @($decode,"$($prefix)_attribute_decode_evidence.csv"),
    @($decodeSummary,"$($prefix)_attribute_decode_summary.csv")
  )
  foreach($e in $exports){if($e[0].Count -gt 0){$e[0]|Export-Csv -LiteralPath (Join-Path $OutDir $e[1]) -NoTypeInformation -Encoding UTF8}}
  Write-Host ""
  Write-Host "Inventory written to: $OutDir"
}
