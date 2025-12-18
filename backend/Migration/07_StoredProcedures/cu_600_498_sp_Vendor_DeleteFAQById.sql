-- =============================================
-- Stored Procedure: sp_Vendor_DeleteFAQById
-- Description: Deletes a specific FAQ for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_DeleteFAQById]'))
    DROP PROCEDURE [dbo].[sp_Vendor_DeleteFAQById];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_DeleteFAQById]
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
