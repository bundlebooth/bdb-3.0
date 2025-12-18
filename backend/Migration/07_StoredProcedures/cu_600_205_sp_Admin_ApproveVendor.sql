-- =============================================
-- Stored Procedure: sp_Admin_ApproveVendor
-- Description: Approves a vendor and makes them visible on the platform
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_ApproveVendor]'))
    DROP PROCEDURE [dbo].[sp_Admin_ApproveVendor];
GO

CREATE PROCEDURE [dbo].[sp_Admin_ApproveVendor]
    @VendorProfileID INT,
    @AdminNotes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
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
