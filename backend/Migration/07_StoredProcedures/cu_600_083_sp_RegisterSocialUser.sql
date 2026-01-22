/*
    Migration Script: Create Stored Procedure [sp_RegisterSocialUser]
    Phase: 600 - Stored Procedures
    Script: cu_600_083_dbo.sp_RegisterSocialUser.sql
    Description: Creates the [users].[sp_RegisterSocialUser] stored procedure
    
    Execution Order: 83
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_RegisterSocialUser]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_RegisterSocialUser]'))
    DROP PROCEDURE [users].[sp_RegisterSocialUser];
GO

CREATE   PROCEDURE [users].[sp_RegisterSocialUser]
    @Email NVARCHAR(100),
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100) = '',
    @AuthProvider NVARCHAR(20),
    @ProfileImageURL NVARCHAR(255) = NULL,
    @IsVendor BIT = 0  -- New parameter for account type
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserID INT;
    DECLARE @IsNewUser BIT = 0;

    SELECT @UserID = UserID FROM users.Users WHERE Email = @Email;

    IF @UserID IS NULL
    BEGIN
        SET @IsNewUser = 1;
        -- User does not exist, create new user with selected account type
        INSERT INTO users.Users (FirstName, LastName, Email, AuthProvider, ProfileImageURL, IsVendor)
        VALUES (@FirstName, @LastName, @Email, @AuthProvider, @ProfileImageURL, @IsVendor);
        SET @UserID = SCOPE_IDENTITY();
        
        -- If vendor, create vendor profile
        IF @IsVendor = 1
        BEGIN
            INSERT INTO vendors.VendorProfiles (UserID, BusinessName)
            VALUES (@UserID, CONCAT(@FirstName, ' ', ISNULL(@LastName, '')));
        END
    END
    ELSE
    BEGIN
        -- User exists, update details if needed (e.g., AuthProvider, Name)
        UPDATE users.Users
        SET AuthProvider = @AuthProvider,
            FirstName = @FirstName,
            LastName = @LastName,
            ProfileImageURL = ISNULL(@ProfileImageURL, ProfileImageURL),
            LastLogin = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE UserID = @UserID;
    END

    SELECT 
        u.UserID, 
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS Name, 
        u.Email, 
        u.IsVendor,
        @IsNewUser AS IsNewUser,  -- Return whether this is a new user
        vp.VendorProfileID
    FROM users.Users u
    LEFT JOIN vendors.VendorProfiles vp ON u.UserID = vp.UserID
    WHERE u.UserID = @UserID;
END;
GO

PRINT 'Stored procedure [users].[sp_RegisterSocialUser] created successfully.';
GO


