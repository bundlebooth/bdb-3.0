-- =============================================
-- Stored Procedure: sp_Vendor_GetProfileStatus
-- Description: Gets vendor profile status
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetProfileStatus]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetProfileStatus];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetProfileStatus]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ProfileStatus,
        SubmittedForReviewAt,
        ReviewedAt,
        RejectionReason,
        AdminNotes,
        IsVerified,
        AcceptingBookings
    FROM VendorProfiles
    WHERE VendorProfileID = @VendorProfileID;
END
GO
