-- =============================================
-- Stored Procedure: vendors.sp_DeleteFAQs
-- Description: Deletes all FAQs for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteFAQs]'))
    DROP PROCEDURE [vendors].[sp_DeleteFAQs];
GO

CREATE PROCEDURE [vendors].[sp_DeleteFAQs]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
