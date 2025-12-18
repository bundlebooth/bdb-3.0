-- =============================================
-- Stored Procedure: sp_Vendor_ApproveProfile
-- Description: Approves vendor profile (admin only)
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_ApproveProfile]'))
    DROP PROCEDURE [dbo].[sp_Vendor_ApproveProfile];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_ApproveProfile]
    @VendorProfileID INT,
    @AdminNotes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles
    SET ProfileStatus = 'approved', 
        IsVerified = 1,
        AcceptingBookings = 1,
        ReviewedAt = GETDATE(),
        AdminNotes = @AdminNotes,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
