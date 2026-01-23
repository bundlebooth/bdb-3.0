-- ============================================================================
-- DATABASE CLEANUP - BATCH 2: Remove Duplicate Stored Procedures
-- ============================================================================
-- Date: January 22, 2026
-- Risk Level: MEDIUM
-- Description: Removes older duplicate stored procedures, keeping the newer
--              versions that are actively used by the API
-- ============================================================================

-- IMPORTANT: Run this AFTER verifying the newer procedures work correctly
-- The migration files will be deleted from the repository

-- ============================================================================
-- ADMIN SCHEMA DUPLICATES
-- ============================================================================

-- sp_Admin_AddChatNote - Keep cu_600_555, delete cu_600_327
IF OBJECT_ID('admin.sp_AddChatNote_OLD', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_AddChatNote_OLD;
GO

-- sp_Admin_GetDashboardStats - Keep cu_600_356, delete cu_600_200
IF OBJECT_ID('admin.sp_GetDashboardStats_OLD', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_GetDashboardStats_OLD;
GO

-- sp_Admin_GetEmailTemplates - Keep cu_600_556, delete cu_600_343
IF OBJECT_ID('admin.sp_GetEmailTemplates_OLD', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_GetEmailTemplates_OLD;
GO

-- sp_Admin_GetPlatformHealth - Keep cu_600_300, delete cu_600_202
IF OBJECT_ID('admin.sp_GetPlatformHealth_OLD', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_GetPlatformHealth_OLD;
GO

-- sp_Admin_SendSystemMessage - Keep cu_600_554, delete cu_600_326 and cu_600_364
IF OBJECT_ID('admin.sp_SendSystemMessage_OLD', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_SendSystemMessage_OLD;
GO

-- ============================================================================
-- BOOKINGS SCHEMA DUPLICATES
-- ============================================================================

-- sp_Bookings_GetBookingForCancellation - Keep cu_600_715, delete cu_600_366
IF OBJECT_ID('bookings.sp_GetBookingForCancellation_OLD', 'P') IS NOT NULL
    DROP PROCEDURE bookings.sp_GetBookingForCancellation_OLD;
GO

-- sp_Bookings_GetVendorBookings - Keep cu_600_714, delete cu_600_672
IF OBJECT_ID('bookings.sp_GetVendorBookings_OLD', 'P') IS NOT NULL
    DROP PROCEDURE bookings.sp_GetVendorBookings_OLD;
GO

-- ============================================================================
-- VENDORS SCHEMA DUPLICATES
-- ============================================================================

-- sp_GetVendorSelectedFeatures - Keep cu_600_146, delete cu_600_075
IF OBJECT_ID('vendors.sp_GetSelectedFeatures_OLD', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_GetSelectedFeatures_OLD;
GO

-- sp_Vendor_DeleteServiceAreas - Keep cu_600_477, delete cu_600_411
IF OBJECT_ID('vendors.sp_DeleteServiceAreas_OLD', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_DeleteServiceAreas_OLD;
GO

-- sp_Vendor_GetImages - Keep cu_600_499, delete cu_600_405
IF OBJECT_ID('vendors.sp_GetImages_OLD', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_GetImages_OLD;
GO

-- sp_Vendor_InsertPredefinedService - Keep cu_600_486, delete cu_600_416
IF OBJECT_ID('vendors.sp_InsertPredefinedService_OLD', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_InsertPredefinedService_OLD;
GO

-- sp_Vendors_UpsertCancellationPolicy - Keep cu_600_716, delete cu_600_369
IF OBJECT_ID('vendors.sp_UpsertCancellationPolicy_OLD', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_UpsertCancellationPolicy_OLD;
GO

PRINT 'Batch 2 cleanup completed - Duplicate stored procedures removed';
GO

-- ============================================================================
-- FILES TO DELETE FROM MIGRATION FOLDER (07_StoredProcedures):
-- ============================================================================
-- 1. cu_600_327_sp_Admin_AddChatNote.sql
-- 2. cu_600_200_sp_Admin_GetDashboardStats.sql
-- 3. cu_600_343_sp_Admin_GetEmailTemplates.sql
-- 4. cu_600_202_sp_Admin_GetPlatformHealth.sql
-- 5. cu_600_326_sp_Admin_SendSystemMessage.sql
-- 6. cu_600_364_sp_Admin_SendSystemMessage.sql
-- 7. cu_600_366_sp_Bookings_GetBookingForCancellation.sql
-- 8. cu_600_672_sp_Bookings_GetVendorBookings.sql
-- 9. cu_600_075_sp_GetVendorSelectedFeatures.sql
-- 10. cu_600_411_sp_Vendor_DeleteServiceAreas.sql
-- 11. cu_600_405_sp_Vendor_GetImages.sql
-- 12. cu_600_416_sp_Vendor_InsertPredefinedService.sql
-- 13. cu_600_369_sp_Vendors_UpsertCancellationPolicy.sql
-- ============================================================================
