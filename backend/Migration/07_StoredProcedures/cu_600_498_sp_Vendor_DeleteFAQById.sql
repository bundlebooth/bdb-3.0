-- =============================================
-- Stored Procedure: vendors.sp_DeleteFAQById
-- Description: Deletes a specific FAQ for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteFAQById]'))
    DROP PROCEDURE [vendors].[sp_DeleteFAQById];
GO

CREATE PROCEDURE [vendors].[sp_DeleteFAQById]
    @VendorProfileID INT,
    @FAQID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorFAQs 
    WHERE VendorProfileID = @VendorProfileID AND FAQID = @FAQID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
