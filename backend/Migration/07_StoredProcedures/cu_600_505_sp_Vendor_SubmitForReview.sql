-- =============================================
-- Stored Procedure: sp_Vendor_SubmitForReview
-- Description: Submits vendor profile for admin review
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_SubmitForReview]'))
    DROP PROCEDURE [dbo].[sp_Vendor_SubmitForReview];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_SubmitForReview]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles
    SET ProfileStatus = 'pending_review', 
        SubmittedForReviewAt = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
