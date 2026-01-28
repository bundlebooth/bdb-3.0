/*
    Migration Script: Create Stored Procedure [sp_Admin_ManageSubcategory]
    Phase: 700 - Stored Procedures
    Script: pb_700_550_sp_Admin_ManageSubcategory.sql
    Description: Admin CRUD operations for subcategories
    
    Execution Order: 550
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_Admin_ManageSubcategory]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_Admin_ManageSubcategory]'))
    DROP PROCEDURE [admin].[sp_Admin_ManageSubcategory];
GO

CREATE PROCEDURE [admin].[sp_Admin_ManageSubcategory]
    @Action NVARCHAR(10), -- 'create', 'update', 'delete'
    @SubcategoryID INT = NULL,
    @Category NVARCHAR(50) = NULL,
    @SubcategoryKey NVARCHAR(50) = NULL,
    @SubcategoryName NVARCHAR(100) = NULL,
    @Description NVARCHAR(500) = NULL,
    @DisplayOrder INT = 0,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Action = 'create'
    BEGIN
        INSERT INTO [admin].[Subcategories] 
            (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
        VALUES 
            (@Category, @SubcategoryKey, @SubcategoryName, @Description, @DisplayOrder, @IsActive, GETUTCDATE(), GETUTCDATE());
        
        SELECT SCOPE_IDENTITY() AS SubcategoryID;
    END
    ELSE IF @Action = 'update'
    BEGIN
        UPDATE [admin].[Subcategories]
        SET 
            Category = COALESCE(@Category, Category),
            SubcategoryKey = COALESCE(@SubcategoryKey, SubcategoryKey),
            SubcategoryName = COALESCE(@SubcategoryName, SubcategoryName),
            Description = @Description,
            DisplayOrder = @DisplayOrder,
            IsActive = @IsActive,
            UpdatedAt = GETUTCDATE()
        WHERE SubcategoryID = @SubcategoryID;
        
        SELECT @SubcategoryID AS SubcategoryID;
    END
    ELSE IF @Action = 'delete'
    BEGIN
        -- Soft delete by setting IsActive = 0
        UPDATE [admin].[Subcategories]
        SET IsActive = 0, UpdatedAt = GETUTCDATE()
        WHERE SubcategoryID = @SubcategoryID;
        
        SELECT @SubcategoryID AS SubcategoryID;
    END
END;
GO

PRINT 'Stored procedure [admin].[sp_Admin_ManageSubcategory] created successfully.';
GO
