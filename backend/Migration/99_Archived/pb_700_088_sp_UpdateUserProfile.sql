/*
    Migration Script: Create Stored Procedure [sp_UpdateUserProfile]
    Phase: 600 - Stored Procedures
    Script: cu_600_102_dbo.sp_UpdateUserProfile.sql
    Description: Creates the [users].[sp_UpdateProfile] stored procedure
    
    Execution Order: 102
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_UpdateProfile]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_UpdateProfile]'))
    DROP PROCEDURE [users].[sp_UpdateProfile];
GO

CREATE   PROCEDURE [users].[sp_UpdateProfile]
    @UserID INT,
    @FirstName NVARCHAR(100) = NULL,
    @LastName NVARCHAR(100) = NULL,
    @Phone NVARCHAR(20) = NULL,
    @Bio NVARCHAR(MAX) = NULL,
    @ProfileImageURL NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE users.Users
    SET 
        FirstName = ISNULL(@FirstName, FirstName),
        LastName = ISNULL(@LastName, LastName),
        Phone = ISNULL(@Phone, Phone),
        Bio = ISNULL(@Bio, Bio),
        ProfileImageURL = ISNULL(@ProfileImageURL, ProfileImageURL),
        UpdatedAt = GETDATE()
    WHERE UserID = @UserID;

    SELECT 1 AS Success;
END;

GO

PRINT 'Stored procedure [users].[sp_UpdateProfile] created successfully.';
GO

