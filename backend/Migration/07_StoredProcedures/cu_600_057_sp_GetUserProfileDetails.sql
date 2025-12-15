/*
    Migration Script: Create Stored Procedure [sp_GetUserProfileDetails]
    Phase: 600 - Stored Procedures
    Script: cu_600_057_dbo.sp_GetUserProfileDetails.sql
    Description: Creates the [dbo].[sp_GetUserProfileDetails] stored procedure
    
    Execution Order: 57
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetUserProfileDetails]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetUserProfileDetails]'))
    DROP PROCEDURE [dbo].[sp_GetUserProfileDetails];
GO

CREATE   PROCEDURE [dbo].[sp_GetUserProfileDetails]
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
    FROM Users
    WHERE UserID = @UserID;
END;

GO

PRINT 'Stored procedure [dbo].[sp_GetUserProfileDetails] created successfully.';
GO
