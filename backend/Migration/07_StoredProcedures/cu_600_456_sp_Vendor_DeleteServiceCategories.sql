-- =============================================
-- Stored Procedure: vendors.sp_DeleteServiceCategories
-- Description: Deletes all service categories for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteServiceCategories]'))
    DROP PROCEDURE [vendors].[sp_DeleteServiceCategories];
GO

CREATE PROCEDURE [vendors].[sp_DeleteServiceCategories]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM vendors.ServiceCategories WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
