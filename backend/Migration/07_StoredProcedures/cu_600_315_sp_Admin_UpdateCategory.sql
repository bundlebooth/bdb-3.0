-- =============================================
-- Stored Procedure: admin.sp_UpdateCategory
-- Description: Updates a category
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_UpdateCategory]'))
    DROP PROCEDURE [admin].[sp_UpdateCategory];
GO

CREATE PROCEDURE [admin].[sp_UpdateCategory]
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
