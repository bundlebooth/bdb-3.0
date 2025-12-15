-- =============================================
-- Stored Procedure: sp_DetachServicesFromCategories
-- Description: Detaches services from categories for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_DetachServicesFromCategories]'))
    DROP PROCEDURE [dbo].[sp_DetachServicesFromCategories];
GO

CREATE PROCEDURE [dbo].[sp_DetachServicesFromCategories]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Services
    SET CategoryID = NULL
    WHERE CategoryID IN (
        SELECT CategoryID FROM ServiceCategories WHERE VendorProfileID = @VendorProfileID
    );
END
GO
