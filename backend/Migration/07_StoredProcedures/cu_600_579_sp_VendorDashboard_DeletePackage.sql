-- =============================================
-- Stored Procedure: sp_VendorDashboard_DeletePackage
-- Description: Deletes a package
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_DeletePackage]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_DeletePackage];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_DeletePackage]
    @PackageID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM Packages WHERE PackageID = @PackageID AND VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
