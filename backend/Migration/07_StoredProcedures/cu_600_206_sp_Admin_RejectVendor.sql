-- =============================================
-- Stored Procedure: sp_Admin_RejectVendor
-- Description: Rejects a vendor and hides them from the platform
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_RejectVendor]'))
    DROP PROCEDURE [dbo].[sp_Admin_RejectVendor];
GO

CREATE PROCEDURE [dbo].[sp_Admin_RejectVendor]
    @VendorProfileID INT,
    @Reason NVARCHAR(MAX) = NULL,
    @AdminNotes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET ProfileStatus = 'rejected', 
        IsVisible = 0,
        RejectionReason = @Reason,
        AdminNotes = @AdminNotes,
        ReviewedAt = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
