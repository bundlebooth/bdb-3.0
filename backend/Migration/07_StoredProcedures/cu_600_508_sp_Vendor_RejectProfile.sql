-- =============================================
-- Stored Procedure: sp_Vendor_RejectProfile
-- Description: Rejects vendor profile (admin only)
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_RejectProfile]'))
    DROP PROCEDURE [dbo].[sp_Vendor_RejectProfile];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_RejectProfile]
    @VendorProfileID INT,
    @RejectionReason NVARCHAR(MAX),
    @AdminNotes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles
    SET ProfileStatus = 'rejected', 
        RejectionReason = @RejectionReason,
        AdminNotes = @AdminNotes,
        ReviewedAt = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
