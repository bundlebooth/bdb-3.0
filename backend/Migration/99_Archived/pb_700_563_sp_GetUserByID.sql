-- =============================================
-- Stored Procedure: users.sp_GetUserByID
-- Description: Get user details by UserID (for referral lookups)
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_GetUserByID]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_GetUserByID]
GO

CREATE PROCEDURE [users].[sp_GetUserByID]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT FirstName, LastName, Email 
    FROM users.Users 
    WHERE UserID = @UserID
END
GO
