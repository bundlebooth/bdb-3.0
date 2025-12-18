/*
    Migration Script: Create Stored Procedure [sp_GetUserProfileDetails]
    Phase: 600 - Stored Procedures
    Script: cu_600_057_dbo.sp_GetUserProfileDetails.sql
    Description: Creates the [users].[sp_GetProfileDetails] stored procedure
    
    Execution Order: 57
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_GetProfileDetails]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetProfileDetails]'))
    DROP PROCEDURE [users].[sp_GetProfileDetails];
GO

CREATE   PROCEDURE [users].[sp_GetProfileDetails]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        UserID,
        Name,
        Email,
        Phone,
        Bio,
        ProfileImageURL,
        IsVendor
    FROM users.Users
    WHERE UserID = @UserID;
END;

GO

PRINT 'Stored procedure [users].[sp_GetProfileDetails] created successfully.';
GO

