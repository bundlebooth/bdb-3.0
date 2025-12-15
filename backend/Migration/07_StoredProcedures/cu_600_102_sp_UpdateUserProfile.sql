/*
    Migration Script: Create Stored Procedure [sp_UpdateUserProfile]
    Phase: 600 - Stored Procedures
    Script: cu_600_102_dbo.sp_UpdateUserProfile.sql
    Description: Creates the [dbo].[sp_UpdateUserProfile] stored procedure
    
    Execution Order: 102
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpdateUserProfile]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateUserProfile]'))
    DROP PROCEDURE [dbo].[sp_UpdateUserProfile];
GO

CREATE   PROCEDURE [dbo].[sp_UpdateUserProfile]
    @UserID INT,
    @Name NVARCHAR(100) = NULL,
    @Phone NVARCHAR(20) = NULL,
    @Bio NVARCHAR(MAX) = NULL,
    @ProfileImageURL NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Users
    SET 
        Name = ISNULL(@Name, Name),
        Phone = ISNULL(@Phone, Phone),
        Bio = ISNULL(@Bio, Bio),
        ProfileImageURL = ISNULL(@ProfileImageURL, ProfileImageURL),
        UpdatedAt = GETDATE()
    WHERE UserID = @UserID;

    SELECT 1 AS Success;
END;

GO

PRINT 'Stored procedure [dbo].[sp_UpdateUserProfile] created successfully.';
GO
