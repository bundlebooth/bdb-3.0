-- =============================================
-- Stored Procedure: sp_Admin_CreateCategory
-- Description: Creates a new category
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_CreateCategory]'))
    DROP PROCEDURE [dbo].[sp_Admin_CreateCategory];
GO

CREATE PROCEDURE [dbo].[sp_Admin_CreateCategory]
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
