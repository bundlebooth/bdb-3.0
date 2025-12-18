-- =============================================
-- Stored Procedure: sp_Admin_SearchUsers
-- Description: Searches users/vendors for support tools
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_SearchUsers]'))
    DROP PROCEDURE [dbo].[sp_Admin_SearchUsers];
GO

CREATE PROCEDURE [dbo].[sp_Admin_SearchUsers]
    @Search NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 10
        'user' as type,
        u.UserID as id,
        u.Name as name,
        u.Email as email,
        CASE WHEN u.IsVendor = 1 THEN 'Vendor' ELSE 'Client' END as accountType
    FROM Users u
    WHERE u.Email LIKE '%' + @Search + '%' OR u.Name LIKE '%' + @Search + '%'
    ORDER BY u.CreatedAt DESC;
END
GO
