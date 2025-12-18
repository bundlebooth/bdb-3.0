-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_DeleteTeam
-- Description: Deletes all team members for vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_DeleteTeam]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_DeleteTeam];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_DeleteTeam]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorTeam WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
