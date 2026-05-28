#Requires -Version 5.1
<#
.SYNOPSIS
    Rebuild and reinstall the Vectair Flite desktop app from the current local repo.

.DESCRIPTION
    For Stuart / internal development use only.

    Pulls the latest main branch, runs npm run tauri:build, locates the newest
    NSIS installer under src-tauri\target\release\bundle\nsis\, and launches it.

    This script does NOT publish a release and does NOT update via GitHub Releases.
    True in-app updates require signed release artifacts and a published latest.json.

    Because tauri.conf.json has createUpdaterArtifacts enabled and a public key
    embedded, release builds require signing credentials:
      TAURI_SIGNING_PRIVATE_KEY
      TAURI_SIGNING_PRIVATE_KEY_PASSWORD

    If these are not already set in your environment, use -PromptForSigningPassword
    to supply them securely for this process only.

.PARAMETER AllowDirty
    Continue even if the working tree has uncommitted changes.

.PARAMETER SkipGitUpdate
    Skip the git checkout + pull step. Useful when building from an existing
    working tree without wanting to change branch state.

.PARAMETER SigningKeyPath
    Path to the Tauri signing private key file.
    Defaults to $HOME\.tauri\vectair-flite.key when -PromptForSigningPassword
    is supplied and this parameter is not specified.

.PARAMETER PromptForSigningPassword
    Prompt securely for the signing key password. Sets TAURI_SIGNING_PRIVATE_KEY
    and TAURI_SIGNING_PRIVATE_KEY_PASSWORD for this process only. Both are cleared
    in a finally block. The password is never written to disk or echoed to the console.

.EXAMPLE
    .\scripts\install-latest-dev-build.ps1

.EXAMPLE
    .\scripts\install-latest-dev-build.ps1 -PromptForSigningPassword

.EXAMPLE
    .\scripts\install-latest-dev-build.ps1 -SkipGitUpdate

.EXAMPLE
    .\scripts\install-latest-dev-build.ps1 -AllowDirty
#>

[CmdletBinding()]
param(
    [switch]$AllowDirty,
    [switch]$SkipGitUpdate,
    [string]$SigningKeyPath = "",
    [switch]$PromptForSigningPassword
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Resolve the repository root relative to this script's location, regardless of
# which directory the caller invoked the script from.
$RepoRoot = Split-Path -Parent $PSScriptRoot

$SigningKeyWasSet = $false
$SigningPasswordWasSet = $false

try {
    # ------------------------------------------------------------------
    # [1/6] Checking repository
    # ------------------------------------------------------------------
    Write-Host "[1/6] Checking repository" -ForegroundColor Cyan

    Push-Location $RepoRoot

    $GitStatus = git status --porcelain 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "git status failed. Make sure you are inside a git repository."
    }

    if ($GitStatus -and -not $AllowDirty) {
        Write-Host ""
        Write-Host "  Working tree is dirty:" -ForegroundColor Yellow
        $GitStatus | ForEach-Object { Write-Host "    $_" }
        Write-Host ""
        Write-Host "  Commit or stash your changes, or re-run with -AllowDirty to continue anyway." -ForegroundColor Yellow
        throw "Refusing to build from a dirty working tree."
    }

    if ($GitStatus -and $AllowDirty) {
        Write-Host "  WARNING: Working tree is dirty (-AllowDirty supplied — continuing)." -ForegroundColor Yellow
    } else {
        Write-Host "  Working tree is clean." -ForegroundColor Green
    }

    # ------------------------------------------------------------------
    # [2/6] Pulling main
    # ------------------------------------------------------------------
    if ($SkipGitUpdate) {
        Write-Host "[2/6] Pulling main  (skipped — -SkipGitUpdate)" -ForegroundColor DarkGray
    } else {
        Write-Host "[2/6] Pulling main" -ForegroundColor Cyan

        git checkout main
        if ($LASTEXITCODE -ne 0) { throw "git checkout main failed." }

        git pull origin main
        if ($LASTEXITCODE -ne 0) { throw "git pull origin main failed." }

        Write-Host "  main is up to date." -ForegroundColor Green
    }

    # ------------------------------------------------------------------
    # Signing key setup
    # ------------------------------------------------------------------
    if ($PromptForSigningPassword) {
        if ($SigningKeyPath -eq "") {
            $SigningKeyPath = Join-Path $HOME ".tauri\vectair-flite.key"
        }

        if (-not (Test-Path $SigningKeyPath)) {
            throw "Signing key file not found: $SigningKeyPath"
        }

        $KeyContents = Get-Content -Raw $SigningKeyPath
        $env:TAURI_SIGNING_PRIVATE_KEY = $KeyContents
        $SigningKeyWasSet = $true

        $SecurePassword = Read-Host -Prompt "  Signing key password" -AsSecureString
        $PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
        )
        $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = $PlainPassword
        $SigningPasswordWasSet = $true
        $PlainPassword = $null

        Write-Host "  Signing credentials loaded for this process." -ForegroundColor Green
    } elseif (-not $env:TAURI_SIGNING_PRIVATE_KEY) {
        Write-Host ""
        Write-Host "  NOTE: TAURI_SIGNING_PRIVATE_KEY is not set in your environment." -ForegroundColor Yellow
        Write-Host "  tauri.conf.json has createUpdaterArtifacts enabled, so signed" -ForegroundColor Yellow
        Write-Host "  updater artifacts will be required. The build may fail." -ForegroundColor Yellow
        Write-Host "  Re-run with -PromptForSigningPassword to supply signing credentials." -ForegroundColor Yellow
        Write-Host ""
    }

    # ------------------------------------------------------------------
    # [3/6] Building installer
    # ------------------------------------------------------------------
    Write-Host "[3/6] Building installer" -ForegroundColor Cyan
    Write-Host "  Running: npm run tauri:build"
    Write-Host "  This may take several minutes..."
    Write-Host ""

    npm run tauri:build
    if ($LASTEXITCODE -ne 0) { throw "npm run tauri:build failed (exit code $LASTEXITCODE)." }

    Write-Host ""
    Write-Host "  Build complete." -ForegroundColor Green

    # ------------------------------------------------------------------
    # [4/6] Locating newest NSIS installer
    # ------------------------------------------------------------------
    Write-Host "[4/6] Locating newest NSIS installer" -ForegroundColor Cyan

    $NsisDir = Join-Path $RepoRoot "src-tauri\target\release\bundle\nsis"

    if (-not (Test-Path $NsisDir)) {
        throw "NSIS bundle directory not found: $NsisDir`nCheck that the build succeeded and produced a Windows NSIS installer."
    }

    $Installers = Get-ChildItem -Path $NsisDir -Filter "*-setup.exe" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending

    if (-not $Installers) {
        throw "No *-setup.exe files found in: $NsisDir"
    }

    $Installer = $Installers[0]
    Write-Host "  Installer: $($Installer.FullName)" -ForegroundColor Green

    # ------------------------------------------------------------------
    # [5/6] Launching installer
    # ------------------------------------------------------------------
    Write-Host "[5/6] Launching installer" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  *** Please close any running Vectair Flite window before continuing. ***" -ForegroundColor Yellow
    Write-Host ""

    Start-Process -FilePath $Installer.FullName -Wait

    # ------------------------------------------------------------------
    # [6/6] Done
    # ------------------------------------------------------------------
    Write-Host "[6/6] Done" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Vectair Flite has been reinstalled from the local development build." -ForegroundColor Green
    Write-Host "  Installer: $($Installer.FullName)" -ForegroundColor Green

} finally {
    # Always clear signing credentials that were set by this script.
    if ($SigningKeyWasSet) {
        $env:TAURI_SIGNING_PRIVATE_KEY = $null
        Remove-Item Env:\TAURI_SIGNING_PRIVATE_KEY -ErrorAction SilentlyContinue
    }
    if ($SigningPasswordWasSet) {
        $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = $null
        Remove-Item Env:\TAURI_SIGNING_PRIVATE_KEY_PASSWORD -ErrorAction SilentlyContinue
    }

    # Restore the caller's working directory.
    Pop-Location -ErrorAction SilentlyContinue
}
