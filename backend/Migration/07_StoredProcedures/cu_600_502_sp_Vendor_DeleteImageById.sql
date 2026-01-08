-- =============================================
-- Stored Procedure: vendors.sp_DeleteImageById
-- Description: Deletes a specific image for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteImageById]'))
    DROP PROCEDURE [vendors].[sp_DeleteImageById];
GO

CREATE PROCEDURE [vendors].[sp_DeleteImageById]
    @VendorProfileID INT,
    @ImageID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM vendors.VendorImages 
    WHERE VendorProfileID = @VendorProfileID AND ImageID = @ImageID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO

