-- =============================================
-- Stored Procedure: vendors.sp_SubmitForReview
-- Description: Submits vendor profile for admin review
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_SubmitForReview]'))
    DROP PROCEDURE [vendors].[sp_SubmitForReview];
GO

CREATE PROCEDURE [vendors].[sp_SubmitForReview]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles
    SET ProfileStatus = 'pending_review', 
        SubmittedForReviewAt = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

