-- =============================================
-- Stored Procedure: users.sp_GetById
-- Description: Gets user by ID with vendor profile
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetById]'))
    DROP PROCEDURE [users].[sp_GetById];
GO

CREATE PROCEDURE [users].[sp_GetById]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT u.UserID, u.Name, u.Email, u.IsVendor, u.IsAdmin, v.VendorProfileID
    FROM users.Users u
    LEFT JOIN vendors.VendorProfiles v ON u.UserID = v.UserID
    WHERE u.UserID = @UserID;
END
GO


