-- =============================================
-- Stored Procedure: vendors.sp_DeleteSocialMedia
-- Description: Deletes all social media entries for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteSocialMedia]'))
    DROP PROCEDURE [vendors].[sp_DeleteSocialMedia];
GO

CREATE PROCEDURE [vendors].[sp_DeleteSocialMedia]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM vendors.VendorSocialMedia WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO

