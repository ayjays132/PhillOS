<#
.SYNOPSIS
    Cross-platform PhillOS build wrapper
#>

param(
    [switch] $BootloaderOnly
)

function Ensure-Command($name, $installHint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Error "`"$name`" is not installed. $installHint"
        exit 1
    }
}

# Detect OS
if ($IsLinux -or $IsMacOS) {
    Write-Host "Detected Unix-like OS → running build.sh"
    & bash ./scripts/build.sh
    if ($BootloaderOnly) {
        & make -C bootloader OUT_DIR=../dist/bootloader iso
    }
}
else {
    Write-Host "Detected Windows → checking dependencies..."
    Ensure-Command make   "Install it via Chocolatey: choco install make mingw nasm"
    Ensure-Command nasm   "Install it via Chocolatey: choco install nasm"
    Ensure-Command gcc    "Part of mingw; choco install mingw"
    
    if ($BootloaderOnly) {
        Write-Host "Building bootloader only…"
        make -C bootloader OUT_DIR=../dist/bootloader iso
    }
    else {
        Write-Host "Building full PhillOS…"
        & bash ./scripts/build.sh
    }
}

Write-Host "✅ Build complete!"
