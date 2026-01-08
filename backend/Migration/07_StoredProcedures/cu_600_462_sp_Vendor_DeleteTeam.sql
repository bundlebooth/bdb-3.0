-- =============================================
-- Stored Procedure: vendors.sp_DeleteTeam
-- Description: Deletes all team members for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteTeam]'))
    DROP PROCEDURE [vendors].[sp_DeleteTeam];
GO

CREATE PROCEDURE [vendors].[sp_DeleteTeam]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorTeam WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
