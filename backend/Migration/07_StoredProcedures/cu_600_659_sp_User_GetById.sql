-- =============================================
-- Stored Procedure: sp_User_GetById
-- Description: Gets user by ID with vendor profile
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_GetById]'))
    DROP PROCEDURE [dbo].[sp_User_GetById];
GO

CREATE PROCEDURE [dbo].[sp_User_GetById]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT u.UserID, u.Name, u.Email, u.IsVendor, u.IsAdmin, v.VendorProfileID
    FROM Users u
    LEFT JOIN VendorProfiles v ON u.UserID = v.UserID
    WHERE u.UserID = @UserID;
END
GO
