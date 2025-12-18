-- =============================================
-- Stored Procedure: vendors.sp_ApproveProfile
-- Description: Approves vendor profile (admin only)
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_ApproveProfile]'))
    DROP PROCEDURE [vendors].[sp_ApproveProfile];
GO

CREATE PROCEDURE [vendors].[sp_ApproveProfile]
    @VendorProfileID INT,
    @AdminNotes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles
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

