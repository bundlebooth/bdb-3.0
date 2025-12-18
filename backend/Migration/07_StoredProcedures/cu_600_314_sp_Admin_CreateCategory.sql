-- =============================================
-- Stored Procedure: admin.sp_CreateCategory
-- Description: Creates a new category
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_CreateCategory]'))
    DROP PROCEDURE [admin].[sp_CreateCategory];
GO

CREATE PROCEDURE [admin].[sp_CreateCategory]
    @CategoryName NVARCHAR(100),
    @Description NVARCHAR(MAX) = NULL,
    @IconClass NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Categories (CategoryName, Description, IconClass, IsActive)
    OUTPUT INSERTED.CategoryID
    VALUES (@CategoryName, @Description, @IconClass, 1);
END
GO
