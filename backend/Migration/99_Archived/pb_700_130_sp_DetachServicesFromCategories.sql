-- =============================================
-- Stored Procedure: vendors.sp_DetachServicesFromCategories
-- Description: Detaches services from categories for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DetachServicesFromCategories]'))
    DROP PROCEDURE [vendors].[sp_DetachServicesFromCategories];
GO

CREATE PROCEDURE [vendors].[sp_DetachServicesFromCategories]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Services
    SET CategoryID = NULL
    WHERE CategoryID IN (
        SELECT CategoryID FROM vendors.ServiceCategories WHERE VendorProfileID = @VendorProfileID
    );
END
GO
