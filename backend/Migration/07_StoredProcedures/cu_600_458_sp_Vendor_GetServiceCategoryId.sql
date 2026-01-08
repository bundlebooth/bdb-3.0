-- =============================================
-- Stored Procedure: vendors.sp_GetServiceCategoryId
-- Description: Gets category ID by name for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetServiceCategoryId]'))
    DROP PROCEDURE [vendors].[sp_GetServiceCategoryId];
GO

CREATE PROCEDURE [vendors].[sp_GetServiceCategoryId]
    @VendorProfileID INT,
    @CategoryName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT CategoryID FROM vendors.ServiceCategories 
    WHERE VendorProfileID = @VendorProfileID AND Name = @CategoryName;
END
GO
