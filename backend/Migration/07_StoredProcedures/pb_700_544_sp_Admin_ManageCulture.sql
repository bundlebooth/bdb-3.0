/*
    Migration Script: Create Stored Procedure [sp_Admin_ManageCulture]
    Phase: 700 - Stored Procedures
    Script: pb_700_544_sp_Admin_ManageCulture.sql
    Description: Admin procedure to add, edit, or delete cultures
    
    Execution Order: 544
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_Admin_ManageCulture]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_Admin_ManageCulture]'))
    DROP PROCEDURE [admin].[sp_Admin_ManageCulture];
GO

CREATE PROCEDURE [admin].[sp_Admin_ManageCulture]
    @Action NVARCHAR(10), -- 'add', 'edit', 'delete'
    @CultureID INT = NULL,
    @CultureKey NVARCHAR(50) = NULL,
    @CultureName NVARCHAR(100) = NULL,
    @DisplayOrder INT = 0,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Action = 'add'
    BEGIN
        INSERT INTO [admin].[Cultures] (CultureKey, CultureName, DisplayOrder, IsActive)
        VALUES (@CultureKey, @CultureName, @DisplayOrder, @IsActive);
        
        SELECT SCOPE_IDENTITY() AS CultureID, 'Culture added successfully' AS Message;
    END
    ELSE IF @Action = 'edit'
    BEGIN
        UPDATE [admin].[Cultures]
        SET 
            CultureKey = COALESCE(@CultureKey, CultureKey),
            CultureName = COALESCE(@CultureName, CultureName),
            DisplayOrder = @DisplayOrder,
            IsActive = @IsActive,
            UpdatedAt = GETUTCDATE()
        WHERE CultureID = @CultureID;
        
        SELECT @CultureID AS CultureID, 'Culture updated successfully' AS Message;
    END
    ELSE IF @Action = 'delete'
    BEGIN
        UPDATE [admin].[Cultures]
        SET IsActive = 0, UpdatedAt = GETUTCDATE()
        WHERE CultureID = @CultureID;
        
        SELECT @CultureID AS CultureID, 'Culture deactivated successfully' AS Message;
    END
END;
GO

PRINT 'Stored procedure [admin].[sp_Admin_ManageCulture] created successfully.';
GO
