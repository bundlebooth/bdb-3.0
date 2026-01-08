/*
    Migration Script: Create Stored Procedure [users].[sp_GetUserProfileDetails]
    Phase: 600 - Stored Procedures
    Script: cu_600_674_sp_Users_GetUserProfileDetails.sql
    Description: Creates the [users].[sp_GetUserProfileDetails] stored procedure
                 Used by GET /api/users/:id/profile endpoint
    
    Execution Order: 674
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_GetUserProfileDetails]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetUserProfileDetails]'))
    DROP PROCEDURE [users].[sp_GetUserProfileDetails];
GO

CREATE PROCEDURE [users].[sp_GetUserProfileDetails]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        UserID, 
        Name, 
        Email, 
        Phone, 
        ProfileImageURL AS Avatar, 
        Bio, 
        IsVendor, 
        IsAdmin, 
        EmailVerified, 
        CreatedAt, 
        UpdatedAt
    FROM users.Users 
    WHERE UserID = @UserID;
END;

GO

PRINT 'Stored procedure [users].[sp_GetUserProfileDetails] created successfully.';
GO
