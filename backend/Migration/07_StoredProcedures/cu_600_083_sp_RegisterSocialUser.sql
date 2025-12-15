/*
    Migration Script: Create Stored Procedure [sp_RegisterSocialUser]
    Phase: 600 - Stored Procedures
    Script: cu_600_083_dbo.sp_RegisterSocialUser.sql
    Description: Creates the [dbo].[sp_RegisterSocialUser] stored procedure
    
    Execution Order: 83
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_RegisterSocialUser]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_RegisterSocialUser]'))
    DROP PROCEDURE [dbo].[sp_RegisterSocialUser];
GO

CREATE   PROCEDURE [dbo].[sp_RegisterSocialUser]
    @Email NVARCHAR(100),
    @Name NVARCHAR(100),
    @AuthProvider NVARCHAR(20),
    @ProfileImageURL NVARCHAR(255) = NULL,
    @IsVendor BIT = 0  -- New parameter for account type
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserID INT;
    DECLARE @IsNewUser BIT = 0;

    SELECT @UserID = UserID FROM Users WHERE Email = @Email;

    IF @UserID IS NULL
    BEGIN
        SET @IsNewUser = 1;
        -- User does not exist, create new user with selected account type
        INSERT INTO Users (Name, Email, AuthProvider, ProfileImageURL, IsVendor)
        VALUES (@Name, @Email, @AuthProvider, @ProfileImageURL, @IsVendor);
        SET @UserID = SCOPE_IDENTITY();
        
        -- If vendor, create vendor profile
        IF @IsVendor = 1
        BEGIN
            INSERT INTO VendorProfiles (UserID, BusinessName)
            VALUES (@UserID, @Name);
        END
    END
    ELSE
    BEGIN
        -- User exists, update details if needed (e.g., AuthProvider, Name)
        UPDATE Users
        SET AuthProvider = @AuthProvider,
            Name = @Name,
            ProfileImageURL = ISNULL(@ProfileImageURL, ProfileImageURL),
            LastLogin = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE UserID = @UserID;
    END

    SELECT 
        u.UserID, 
        u.Name, 
        u.Email, 
        u.IsVendor,
        @IsNewUser AS IsNewUser,  -- Return whether this is a new user
        vp.VendorProfileID
    FROM Users u
    LEFT JOIN VendorProfiles vp ON u.UserID = vp.UserID
    WHERE u.UserID = @UserID;
END;
GO

PRINT 'Stored procedure [dbo].[sp_RegisterSocialUser] created successfully.';
GO
