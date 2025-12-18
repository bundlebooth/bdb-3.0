-- =============================================
-- Stored Procedure: sp_Admin_SuspendVendor
-- Description: Suspends a vendor and hides them from the platform
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_SuspendVendor]'))
    DROP PROCEDURE [dbo].[sp_Admin_SuspendVendor];
GO

CREATE PROCEDURE [dbo].[sp_Admin_SuspendVendor]
    @VendorProfileID INT,
    @Reason NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET AcceptingBookings = 0, 
        IsVerified = 0,
        IsVisible = 0,
        AdminNotes = @Reason,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
