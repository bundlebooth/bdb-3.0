-- =============================================
-- Stored Procedure: sp_Admin_UpdateCategory
-- Description: Updates a category
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_UpdateCategory]'))
    DROP PROCEDURE [dbo].[sp_Admin_UpdateCategory];
GO

CREATE PROCEDURE [dbo].[sp_Admin_UpdateCategory]
    @CategoryID INT,
    @CategoryName NVARCHAR(100),
    @Description NVARCHAR(MAX) = NULL,
    @IconClass NVARCHAR(100) = NULL,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Categories 
    SET CategoryName = @CategoryName, 
        Description = @Description, 
        IconClass = @IconClass, 
        IsActive = @IsActive
    WHERE CategoryID = @CategoryID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
