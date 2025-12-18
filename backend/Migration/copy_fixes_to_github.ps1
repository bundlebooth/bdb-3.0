# PowerShell script to copy fixed migration files to GitHub location
# Run this script to sync fixes from Desktop to GitHub folder

$SourceBase = "C:\Users\samim\OneDrive\Desktop\BOOKING MODAL\bdb-3.0-main\db\Migration"
$DestBase = "C:\Users\samim\OneDrive\Documents\GitHub\bdb-3.0\backend\Migration"

# List of fixed files to copy
$FilesToCopy = @(
    "07_StoredProcedures\cu_600_204_sp_Admin_GetVendorApprovals.sql",
    "07_StoredProcedures\cu_600_306_sp_Admin_GetAllVendors.sql",
    "07_StoredProcedures\cu_600_316_sp_Admin_DeleteCategory.sql",
    "07_StoredProcedures\cu_600_317_sp_Admin_GetAnalytics.sql",
    "07_StoredProcedures\cu_600_369_sp_Admin_GetUsersWithTwoFactor.sql",
    "07_StoredProcedures\cu_600_370_sp_Admin_ResetUser2FA.sql",
    "07_StoredProcedures\cu_600_410_sp_Vendor_InsertCategory.sql",
    "07_StoredProcedures\cu_600_412_sp_Vendor_InsertServiceArea.sql",
    "07_StoredProcedures\cu_600_425_sp_Vendor_InsertSelectedFeature.sql",
    "07_StoredProcedures\cu_600_431_sp_Vendor_GetServiceAreas.sql",
    "07_StoredProcedures\cu_600_433_sp_Vendor_GetExtraFields.sql",
    "07_StoredProcedures\cu_600_445_sp_Vendor_UpdateTimezone.sql",
    "07_StoredProcedures\cu_600_499_sp_Vendor_GetImages.sql",
    "07_StoredProcedures\cu_600_650_sp_User_CheckEmailExists.sql",
    "07_StoredProcedures\cu_600_661_sp_User_GetMe.sql",
    "09_Permissions\cu_800_01_DatabasePermissions.sql"
)

Write-Host "Copying fixed migration files from Desktop to GitHub location..." -ForegroundColor Cyan

foreach ($file in $FilesToCopy) {
    $source = Join-Path $SourceBase $file
    $dest = Join-Path $DestBase $file
    
    if (Test-Path $source) {
        # Ensure destination directory exists
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item -Path $source -Destination $dest -Force
        Write-Host "  Copied: $file" -ForegroundColor Green
    } else {
        Write-Host "  NOT FOUND: $source" -ForegroundColor Red
    }
}

Write-Host "`nDone! Re-run your migration script." -ForegroundColor Cyan
