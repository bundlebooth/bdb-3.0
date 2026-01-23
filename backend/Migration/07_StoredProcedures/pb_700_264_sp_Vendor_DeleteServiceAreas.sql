-- =============================================
-- Stored Procedure: vendors.sp_DeleteServiceAreas
-- Description: Deletes all service areas for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteServiceAreas]'))
    DROP PROCEDURE [vendors].[sp_DeleteServiceAreas];
GO

CREATE PROCEDURE [vendors].[sp_DeleteServiceAreas]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorServiceAreas WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
