$ErrorActionPreference = 'Stop'

$projectDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDirectory

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx --yes wrangler@4 pages deploy out --project-name jadwalsholat
exit $LASTEXITCODE
