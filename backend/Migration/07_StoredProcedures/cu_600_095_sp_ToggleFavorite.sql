/*
    Migration Script: Create Stored Procedure [sp_ToggleFavorite]
    Phase: 600 - Stored Procedures
    Script: cu_600_095_dbo.sp_ToggleFavorite.sql
    Description: Creates the [users].[sp_ToggleFavorite] stored procedure
    
    Execution Order: 95
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_ToggleFavorite]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_ToggleFavorite]'))
    DROP PROCEDURE [users].[sp_ToggleFavorite];
GO

CREATE   PROCEDURE [users].[sp_ToggleFavorite]
    @UserID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if favorite exists
    IF EXISTS (SELECT 1 FROM users.Favorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID)
    BEGIN
        -- Remove favorite
        DELETE FROM users.Favorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID;
        SELECT 'removed' as Status, 0 as IsFavorite;
    END
    ELSE
    BEGIN
        -- Add favorite
        INSERT INTO users.Favorites (UserID, VendorProfileID, CreatedAt)
        VALUES (@UserID, @VendorProfileID, GETDATE());
        SELECT 'added' as Status, 1 as IsFavorite;
    END
END

GO

PRINT 'Stored procedure [users].[sp_ToggleFavorite] created successfully.';
GO

