/*
    Migration Script: Create Stored Procedure [sp_DeletePortfolioImage]
    Phase: 600 - Stored Procedures
    Script: cu_600_022_dbo.sp_DeletePortfolioImage.sql
    Description: Creates the [dbo].[sp_DeletePortfolioImage] stored procedure
    
    Execution Order: 22
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_DeletePortfolioImage]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_DeletePortfolioImage]'))
    DROP PROCEDURE [dbo].[sp_DeletePortfolioImage];
GO

CREATE   PROCEDURE [dbo].[sp_DeletePortfolioImage]
    @PortfolioImageID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (
        SELECT 1 FROM VendorPortfolioImages 
        WHERE PortfolioImageID = @PortfolioImageID AND VendorProfileID = @VendorProfileID
    )
    BEGIN
        DELETE FROM VendorPortfolioImages WHERE PortfolioImageID = @PortfolioImageID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Image not found or access denied.', 16, 1);
        SELECT 0 AS Success;
    END
END;

GO

PRINT 'Stored procedure [dbo].[sp_DeletePortfolioImage] created successfully.';
GO
