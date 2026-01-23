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
        u.UserID, 
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS Name,
        u.FirstName,
        u.LastName, 
        u.Email, 
        u.Phone, 
        u.ProfileImageURL, 
        u.ProfileImageURL AS Avatar, 
        u.Bio, 
        u.IsVendor, 
        u.IsAdmin, 
        u.EmailVerified,
        u.IsActive,
        u.CreatedAt, 
        u.UpdatedAt,
        v.VendorProfileID
    FROM users.Users u
    LEFT JOIN vendors.VendorProfiles v ON v.UserID = u.UserID
    WHERE u.UserID = @UserID;
END;

GO

PRINT 'Stored procedure [users].[sp_GetUserProfileDetails] created successfully.';
GO
