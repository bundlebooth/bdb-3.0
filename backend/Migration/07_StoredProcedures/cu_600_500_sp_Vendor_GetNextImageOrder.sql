-- =============================================
-- Stored Procedure: vendors.sp_GetNextImageOrder
-- Description: Gets the next display order for vendor images
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetNextImageOrder]'))
    DROP PROCEDURE [vendors].[sp_GetNextImageOrder];
GO

CREATE PROCEDURE [vendors].[sp_GetNextImageOrder]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT ISNULL(MAX(DisplayOrder), -1) + 1 as NextOrder
    FROM vendors.VendorImages
    WHERE VendorProfileID = @VendorProfileID;
END
GO

