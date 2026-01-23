-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_DeletePackage
-- Description: Deletes a package
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_DeletePackage]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_DeletePackage];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_DeletePackage]
    @PackageID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM Packages WHERE PackageID = @PackageID AND VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
