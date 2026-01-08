-- =============================================
-- Stored Procedure: admin.sp_SearchUsers
-- Description: Searches users/vendors for support tools
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_SearchUsers]'))
    DROP PROCEDURE [admin].[sp_SearchUsers];
GO

CREATE PROCEDURE [admin].[sp_SearchUsers]
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
    FROM users.Users u
    WHERE u.Email LIKE '%' + @Search + '%' OR u.Name LIKE '%' + @Search + '%'
    ORDER BY u.CreatedAt DESC;
END
GO

