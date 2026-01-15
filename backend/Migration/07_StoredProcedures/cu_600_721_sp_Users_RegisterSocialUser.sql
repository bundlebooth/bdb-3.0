/*
    Migration Script: Create Stored Procedure [users].[sp_RegisterSocialUser]
    Description: Registers a social login user with default values to prevent NULLs
    
    Execution Order: 721
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_RegisterSocialUser]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_RegisterSocialUser]'))
    DROP PROCEDURE [users].[sp_RegisterSocialUser];
GO

CREATE PROCEDURE [users].[sp_RegisterSocialUser]
    @Email NVARCHAR(100),
    @Name NVARCHAR(100),
    @AuthProvider NVARCHAR(20),
    @ProfileImageURL NVARCHAR(255) = NULL,
    @IsVendor BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate required fields
    IF @Email IS NULL OR LTRIM(RTRIM(@Email)) = ''
    BEGIN
        RAISERROR('Email is required', 16, 1);
        RETURN;
    END

    IF @Name IS NULL OR LTRIM(RTRIM(@Name)) = ''
    BEGIN
        RAISERROR('Name is required', 16, 1);
        RETURN;
    END

    IF @AuthProvider IS NULL OR LTRIM(RTRIM(@AuthProvider)) = ''
    BEGIN
        RAISERROR('Auth provider is required', 16, 1);
        RETURN;
    END

    DECLARE @UserID INT;
    DECLARE @IsNewUser BIT = 0;

    SELECT @UserID = UserID FROM users.Users WHERE Email = @Email;

    IF @UserID IS NULL
    BEGIN
        SET @IsNewUser = 1;
        INSERT INTO users.Users (
            Name, Email, AuthProvider, ProfileImageURL, IsVendor, 
            Phone, Bio, StripeCustomerID, 
            CreatedAt, UpdatedAt
        )
        VALUES (
            @Name, @Email, @AuthProvider, @ProfileImageURL, @IsVendor, 
            '', '', '', 
            GETDATE(), GETDATE()
        );
        SET @UserID = SCOPE_IDENTITY();

        IF @IsVendor = 1
        BEGIN
            INSERT INTO vendors.VendorProfiles (
                UserID, BusinessName, BusinessPhone, BusinessEmail, 
                Website, LogoURL, StripeAccountID, 
                AvgRating, TotalBookings, TotalReviews, 
                CreatedAt, UpdatedAt
            )
            VALUES (
                @UserID, @Name, '', '', 
                '', '', '', 
                0, 0, 0, 
                GETDATE(), GETDATE()
            );
        END
    END
    ELSE
    BEGIN
        UPDATE users.Users
        SET AuthProvider = @AuthProvider,
            Name = @Name,
            ProfileImageURL = CASE WHEN @ProfileImageURL IS NOT NULL THEN @ProfileImageURL ELSE ProfileImageURL END,
            LastLogin = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE UserID = @UserID;
    END

    SELECT u.UserID, u.Name, u.Email, u.IsVendor, @IsNewUser AS IsNewUser, vp.VendorProfileID
    FROM users.Users u
    LEFT JOIN vendors.VendorProfiles vp ON u.UserID = vp.UserID
    WHERE u.UserID = @UserID;
END;
GO

PRINT 'Stored procedure [users].[sp_RegisterSocialUser] created successfully.';
GO
