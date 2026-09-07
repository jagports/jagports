# Traficom XK Range Parser

## Purpose

Document the implementation and operational lessons from developing a PowerShell parser for large Finnish Traficom vehicle-registration files used in Jaguar XK/XK8/XKR research.

## Implementation

The parser accepts the source file as its first positional parameter and processes the source as a stream rather than loading the complete file into memory.

Filtering is based on the Traficom columns:

- `merkkiSelvakielinen` = `Jaguar`
- `mallimerkinta` contains `XK`, `XK8`, or `XKR`
- `kayttoonottopvm` is an eight-digit `YYYYMMDD` value whose year is greater than 1995

Matching original source lines are written immediately to the output file.

The output filename is formed as:

`<script-name>+<source-file-name>-output.txt`

The output is created in the script directory.

## Large-file lesson

`Import-Csv` loads the complete dataset into PowerShell objects. This is unsuitable for a source around 900 MB and several million lines when bounded memory use is required.

The implementation therefore uses `System.IO.StreamReader.ReadLine()` and processes one source line at a time. Matching lines are written directly through `System.IO.StreamWriter` instead of accumulating them in an array.

This keeps memory usage approximately independent of total source-file size.

## PowerShell lessons

### Script invocation

The script can be invoked from any current working directory:

`& "C:\path\Get XK Range.ps1" "C:\path\source.csv"`

A relative source filename is resolved against the PowerShell current working directory, so this also works when the file is in `C:\temp`:

`& "C:\path\Get XK Range.ps1" .\TieliikenneAvoinData_30_06_2026.csv`

The command line itself is not required to use the script directory as its working directory.

### Parameter handling

`param()` must occur at the beginning of a PowerShell script, before executable statements.

A missing required input filename should be handled explicitly by the script so that it prints an error instead of entering an unwanted interactive parameter prompt.

### Markdown contamination

PowerShell source files must contain only PowerShell source. Markdown code-fence markers such as ` ```powershell` and ` ``` ` must never be copied into `.ps1` files. Such markers caused execution errors at line 1 and at the end of the script during development.

### `$Matches` collision

PowerShell's `-match` operator populates the automatic `$Matches` hashtable. Because PowerShell variable names are case-insensitive, an accumulator named `$matches` conflicts with that automatic variable.

Do not use `$matches` as a result accumulator in code that also uses `-match`. Use a different name such as `$results`, or write matches directly to the output stream.

### Date filtering

The Traficom `kayttoonottopvm` value observed in the source is `YYYYMMDD`, for example `19970404`.

The year is extracted with:

`$year = [int]$date.Substring(0,4)`

and accepted when `$year -gt 1995`.

The supplied 1997 Jaguar XK8 test record therefore passes the date filter.

## Verified sample

The test record contains:

- `merkkiSelvakielinen`: `Jaguar`
- `mallimerkinta`: `COUPE XK8 4.0-AUTOMATIC-JGED/259`
- `kayttoonottopvm`: `19970404`
- `valmistenumero2`: `SAJJGAED4A`

The parser returned one match for the sample.

## Operational command

Typical invocation:

`& "C:\Users\tomil\OneDrive - Tomi Lind\_jagports\3.Info X100 XK8 - XKR - XKR 100\_Registration Numbers on Countries\FIN\Get XK Range.ps1" "C:\Users\tomil\OneDrive - Tomi Lind\_jagports\3.Info X100 XK8 - XKR - XKR 100\_Registration Numbers on Countries\FIN\Get Xk Range Sample.txt"`

For the large source, the same command form is used with the large CSV filename.

## Progress reporting

The parser reports the number of scanned lines while processing by rewriting the current console line. This provides visible progress without accumulating progress output for millions of records.

## Scope and limitations

The parser intentionally uses the known Traficom semicolon-delimited, single-record-per-line structure. It is not intended as a general RFC CSV parser for arbitrary multiline quoted CSV data.

The implementation is a research/data-preparation utility for the Jagports vehicle-information work; it is not a general production CSV ingestion component.