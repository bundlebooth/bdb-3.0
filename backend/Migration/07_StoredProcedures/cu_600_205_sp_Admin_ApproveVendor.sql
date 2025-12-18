-- =============================================
-- Stored Procedure: admin.sp_ApproveVendor
-- Description: Approves a vendor and makes them visible on the platform
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_ApproveVendor]'))
    DROP PROCEDURE [admin].[sp_ApproveVendor];
GO

CREATE PROCEDURE [admin].[sp_ApproveVendor]
    @VendorProfileID INT,
    @AdminNotes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET ProfileStatus = 'approved', 
        AcceptingBookings = 1, 
        IsVerified = 1,
        IsVisible = 1,
        AdminNotes = @AdminNotes,
        ReviewedAt = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

