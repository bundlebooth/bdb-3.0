-- =============================================
-- Stored Procedure: users.sp_GetProfile
-- Description: Gets user profile by ID
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetProfile]'))
    DROP PROCEDURE [users].[sp_GetProfile];
GO

CREATE PROCEDURE [users].[sp_GetProfile]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        UserID,
        Name,
        Email,
        Phone,
        ProfileImageURL,
        IsVendor,
        IsActive,
        CreatedAt
    FROM users.Users 
    WHERE UserID = @UserID;
END
GO

