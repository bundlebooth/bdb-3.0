-- =============================================
-- Stored Procedure: admin.sp_SuspendVendor
-- Description: Suspends a vendor and hides them from the platform
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_SuspendVendor]'))
    DROP PROCEDURE [admin].[sp_SuspendVendor];
GO

CREATE PROCEDURE [admin].[sp_SuspendVendor]
    @VendorProfileID INT,
    @Reason NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET AcceptingBookings = 0, 
        IsVerified = 0,
        IsVisible = 0,
        AdminNotes = @Reason,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

