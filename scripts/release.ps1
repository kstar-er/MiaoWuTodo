param(
  [string]$Version,
  [string]$Branch = "main",
  [string]$GithubRemote = "origin",
  [string]$GiteeRemote = "gitee",
  [switch]$CommitAll,
  [switch]$SkipGitee,
  [switch]$NoPush
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
  param(
    [string]$Title,
    [scriptblock]$Command
  )

  Write-Host ""
  Write-Host "==> $Title" -ForegroundColor Cyan
  & $Command
}

function Test-GitRemote {
  param([string]$Name)
  $remotes = git remote
  return $remotes -contains $Name
}

Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git is not installed or not in PATH."
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed or not in PATH."
}

$currentBranch = (git branch --show-current).Trim()
if ($currentBranch -ne $Branch) {
  throw "Current branch is '$currentBranch', expected '$Branch'."
}

if (-not (Test-GitRemote $GithubRemote)) {
  throw "Git remote '$GithubRemote' does not exist. Add it or pass -GithubRemote <name>."
}

if (-not $SkipGitee -and -not (Test-GitRemote $GiteeRemote)) {
  Write-Host "Gitee remote '$GiteeRemote' does not exist. Gitee push will be skipped." -ForegroundColor Yellow
  $SkipGitee = $true
}

if (-not $Version) {
  $pkg = Get-Content -Raw -LiteralPath "package.json" | ConvertFrom-Json
  $Version = $pkg.version
}

if ($Version -notmatch '^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$') {
  throw "Invalid version '$Version'. Expected format like 1.1.8."
}

$tag = "v$Version"

git fetch $GithubRemote --tags
if (git rev-parse -q --verify "refs/tags/$tag") {
  throw "Local tag '$tag' already exists."
}
if (git ls-remote --tags $GithubRemote $tag) {
  throw "Remote tag '$tag' already exists on '$GithubRemote'."
}

$dirtyBeforeVersionSync = git status --porcelain
if ($dirtyBeforeVersionSync -and -not $CommitAll) {
  Write-Host "Working tree has uncommitted changes:" -ForegroundColor Yellow
  $dirtyBeforeVersionSync
  throw "Commit or stash changes first, or rerun with -CommitAll to include them in the release commit."
}

Invoke-Step "Sync version files to $Version" {
  node scripts/set-version.mjs $Version
}

Invoke-Step "Stage release files" {
  if ($CommitAll) {
    git add -A
  } else {
    git add package.json package-lock.json src-tauri/tauri.conf.json
  }
}

$staged = git diff --cached --name-only
if ($staged) {
  Invoke-Step "Commit release version" {
    git commit -m "release: $tag"
  }
} else {
  Write-Host "No version file changes to commit." -ForegroundColor Yellow
}

Invoke-Step "Create tag $tag" {
  git tag $tag
}

if ($NoPush) {
  Write-Host ""
  Write-Host "NoPush enabled. Created local tag only: $tag" -ForegroundColor Yellow
  exit 0
}

Invoke-Step "Push $Branch and $tag to $GithubRemote" {
  git push $GithubRemote "HEAD:$Branch"
  git push $GithubRemote $tag
}

if (-not $SkipGitee) {
  Invoke-Step "Push $Branch and $tag to $GiteeRemote" {
    git push $GiteeRemote "HEAD:$Branch"
    git push $GiteeRemote $tag
  }
}

Write-Host ""
Write-Host "Release pushed: $tag" -ForegroundColor Green
Write-Host "GitHub Actions will build the app from the pushed tag."
