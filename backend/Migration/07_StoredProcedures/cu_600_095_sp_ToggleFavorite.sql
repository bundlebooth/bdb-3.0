/*
    Migration Script: Create Stored Procedure [sp_ToggleFavorite]
    Phase: 600 - Stored Procedures
    Script: cu_600_095_dbo.sp_ToggleFavorite.sql
    Description: Creates the [dbo].[sp_ToggleFavorite] stored procedure
    
    Execution Order: 95
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_ToggleFavorite]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_ToggleFavorite]'))
    DROP PROCEDURE [dbo].[sp_ToggleFavorite];
GO

CREATE   PROCEDURE [dbo].[sp_ToggleFavorite]
    @UserID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if favorite exists
    IF EXISTS (SELECT 1 FROM Favorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID)
    BEGIN
        -- Remove favorite
        DELETE FROM Favorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID;
        SELECT 'removed' as Status, 0 as IsFavorite;
    END
    ELSE
    BEGIN
        -- Add favorite
        INSERT INTO Favorites (UserID, VendorProfileID, CreatedAt)
        VALUES (@UserID, @VendorProfileID, GETDATE());
        SELECT 'added' as Status, 1 as IsFavorite;
    END
END

GO

PRINT 'Stored procedure [dbo].[sp_ToggleFavorite] created successfully.';
GO
