-- Section 10: Stored Procedures - User Management

-- sp_User_Create: Register new users
CREATE PROCEDURE sp_User_Create
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255) = NULL,
    @PasswordSalt NVARCHAR(255) = NULL,
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100),
    @PhoneNumber NVARCHAR(20) = NULL,
    @AvatarURL NVARCHAR(255) = NULL,
    @DateOfBirth DATE = NULL,
    @RoleName NVARCHAR(50) = 'Customer',
    @IsSocialLogin BIT = 0,
    @UserID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
GO
    BEGIN TRANSACTION;
GO
    BEGIN TRY
        -- Check if email already exists
        IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
        BEGIN
            IF @IsSocialLogin = 1
            BEGIN
                -- For social login, return existing user ID
                SELECT @UserID = UserID FROM Users WHERE Email = @Email;
GO
            END
            ELSE
            BEGIN
                -- For regular registration, email must be unique
                THROW 50001, 'Email address is already registered.', 1;
GO
            END
        END
        ELSE
        BEGIN
            -- Insert new user
            INSERT INTO Users (
                Email, PasswordHash, PasswordSalt, FirstName, LastName, 
                PhoneNumber, AvatarURL, DateOfBirth, EmailConfirmed, IsActive
            )
            VALUES (
                @Email, @PasswordHash, @PasswordSalt, @FirstName, @LastName, 
                @PhoneNumber, @AvatarURL, @DateOfBirth, CASE WHEN @IsSocialLogin = 1 THEN 1 ELSE 0 END, 1
            );
GO
            SET @UserID = SCOPE_IDENTITY();
GO
            -- Add user role
            DECLARE @RoleID INT;
GO
            SELECT @RoleID = RoleID FROM UserRoles WHERE RoleName = @RoleName;
GO
            IF @RoleID IS NULL
            BEGIN
                SET @RoleID = 3; -- Default to Customer if role not found
            END
            
            INSERT INTO UserRoleMappings (UserID, RoleID)
            VALUES (@UserID, @RoleID);
GO
        END
        
        COMMIT TRANSACTION;
GO
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
GO
        THROW;
GO
    END CATCH
END;
GO

-- sp_User_Authenticate: Handle login
CREATE PROCEDURE sp_User_Authenticate
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
GO
    DECLARE @UserID INT;
GO
    DECLARE @IsLockedOut BIT;
GO
    DECLARE @LockoutEndDate DATETIME;
GO
    DECLARE @StoredHash NVARCHAR(255);
GO
    DECLARE @StoredSalt NVARCHAR(255);
GO
    -- Get user data
    SELECT 
        @UserID = UserID,
        @IsLockedOut = IsLockedOut,
        @LockoutEndDate = LockoutEndDate,
        @StoredHash = PasswordHash,
        @StoredSalt = PasswordSalt
    FROM Users 
    WHERE Email = @Email;
GO
    -- Check if account exists
    IF @UserID IS NULL
    BEGIN
        RAISERROR('Invalid email or password.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Check if account is locked
    IF @IsLockedOut = 1 AND (@LockoutEndDate IS NULL OR @LockoutEndDate > GETDATE())
    BEGIN
        RAISERROR('Account is temporarily locked. Please try again later or reset your password.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Verify password
    IF @StoredHash IS NULL OR @StoredHash <> @PasswordHash
    BEGIN
        -- Increment failed login attempt
        UPDATE Users 
        SET FailedLoginAttempts = FailedLoginAttempts + 1,
            IsLockedOut = CASE WHEN FailedLoginAttempts + 1 >= 5 THEN 1 ELSE 0 END,
            LockoutEndDate = CASE WHEN FailedLoginAttempts + 1 >= 5 THEN DATEADD(MINUTE, 30, GETDATE()) ELSE NULL END
        WHERE UserID = @UserID;
GO
        RAISERROR('Invalid email or password.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Successful login - reset failed attempts and update last login
    UPDATE Users 
    SET FailedLoginAttempts = 0,
        IsLockedOut = 0,
        LockoutEndDate = NULL,
        LastLoginDate = GETDATE()
    WHERE UserID = @UserID;
GO
    -- Return user data
    SELECT 
        u.UserID,
        u.Email,
        u.FirstName,
        u.LastName,
        u.PhoneNumber,
        u.AvatarURL,
        u.TwoFactorEnabled,
        r.RoleName
    FROM Users u
    INNER JOIN UserRoleMappings m ON u.UserID = m.UserID
    INNER JOIN UserRoles r ON m.RoleID = r.RoleID
    WHERE u.UserID = @UserID;
GO
END;
GO

-- sp_User_UpdateProfile: Update user information
CREATE PROCEDURE sp_User_UpdateProfile
    @UserID INT,
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100),
    @PhoneNumber NVARCHAR(20) = NULL,
    @AvatarURL NVARCHAR(255) = NULL,
    @DateOfBirth DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
GO
    UPDATE Users
    SET 
        FirstName = @FirstName,
        LastName = @LastName,
        PhoneNumber = @PhoneNumber,
        AvatarURL = @AvatarURL,
        DateOfBirth = @DateOfBirth,
        ModifiedDate = GETDATE()
    WHERE UserID = @UserID;
GO
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('User not found.', 16, 1);
GO
    END
END;
GO

-- sp_User_ResetPassword: Password reset functionality
CREATE PROCEDURE sp_User_ResetPassword
    @Email NVARCHAR(255),
    @NewPasswordHash NVARCHAR(255),
    @NewPasswordSalt NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
GO
    UPDATE Users
    SET 
        PasswordHash = @NewPasswordHash,
        PasswordSalt = @NewPasswordSalt,
        FailedLoginAttempts = 0,
        IsLockedOut = 0,
        LockoutEndDate = NULL,
        ModifiedDate = GETDATE()
    WHERE Email = @Email;
GO
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('User not found.', 16, 1);
GO
    END
END;
GO

-- sp_User_GetFavorites: Retrieve user's saved providers
CREATE PROCEDURE sp_User_GetFavorites
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
GO
    SELECT 
        w.WishlistID,
        w.ProviderID,
        sp.BusinessName,
        pt.TypeName AS ProviderType,
        (SELECT AVG(CAST(pr.Rating AS DECIMAL(5,2))) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS AverageRating,
        (SELECT COUNT(*) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS ReviewCount,
        sp.BasePrice,
        (SELECT TOP 1 ImageURL FROM ProviderPortfolio pp WHERE pp.ProviderID = sp.ProviderID ORDER BY pp.IsFeatured DESC, pp.DisplayOrder) AS PrimaryImage,
        w.CreatedDate AS AddedDate
    FROM 
        Wishlists w
        INNER JOIN ServiceProviders sp ON w.ProviderID = sp.ProviderID
        INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
    WHERE 
        w.UserID = @UserID
    ORDER BY 
        w.CreatedDate DESC;
GO
END;
GO

-- sp_UserSocialLogin_CreateOrUpdate: Handle social login registration/authentication
CREATE PROCEDURE sp_UserSocialLogin_CreateOrUpdate
    @ProviderName NVARCHAR(50),
    @ProviderKey NVARCHAR(255),
    @Email NVARCHAR(255),
    @FirstName NVARCHAR(100) = NULL,
    @LastName NVARCHAR(100) = NULL,
    @ProfilePictureURL NVARCHAR(255) = NULL,
    @AccessToken NVARCHAR(MAX),
    @RefreshToken NVARCHAR(MAX) = NULL,
    @TokenExpiration DATETIME = NULL,
    @UserID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
GO
    DECLARE @ProviderID INT;
GO
    -- Get provider ID
    SELECT @ProviderID = ProviderID 
    FROM SocialLoginProviders 
    WHERE ProviderName = @ProviderName;
GO
    IF @ProviderID IS NULL
    BEGIN
        RAISERROR('Social login provider not supported.', 16, 1);
GO
        RETURN;
GO
    END
    
    BEGIN TRANSACTION;
GO
    BEGIN TRY
        -- Check if social login already exists
        DECLARE @ExistingUserID INT;
GO
        SELECT @ExistingUserID = UserID 
        FROM UserSocialLogins 
        WHERE ProviderID = @ProviderID AND ProviderKey = @ProviderKey;
GO
        IF @ExistingUserID IS NOT NULL
        BEGIN
            -- Update existing social login
            UPDATE UserSocialLogins
            SET 
                Email = @Email,
                FirstName = @FirstName,
                LastName = @LastName,
                ProfilePictureURL = @ProfilePictureURL,
                AccessToken = @AccessToken,
                RefreshToken = @RefreshToken,
                TokenExpiration = @TokenExpiration,
                LastLoginDate = GETDATE()
            WHERE 
                ProviderID = @ProviderID AND ProviderKey = @ProviderKey;
GO
            SET @UserID = @ExistingUserID;
GO
            -- Update user's last login
            UPDATE Users
            SET LastLoginDate = GETDATE()
            WHERE UserID = @UserID;
GO
        END
        ELSE
        BEGIN
            -- Check if email exists in users table
            SELECT @UserID = UserID 
            FROM Users 
            WHERE Email = @Email;
GO
            -- Create new user if not exists
            IF @UserID IS NULL
            BEGIN
                EXEC sp_User_Create 
                    @Email = @Email,
                    @FirstName = @FirstName,
                    @LastName = @LastName,
                    @AvatarURL = @ProfilePictureURL,
                    @IsSocialLogin = 1,
                    @UserID = @UserID OUTPUT;
GO
            END
            
            -- Add social login
            INSERT INTO UserSocialLogins (
                UserID, ProviderID, ProviderKey, Email, FirstName, LastName, 
                ProfilePictureURL, AccessToken, RefreshToken, TokenExpiration
            )
            VALUES (
                @UserID, @ProviderID, @ProviderKey, @Email, @FirstName, @LastName, 
                @ProfilePictureURL, @AccessToken, @RefreshToken, @TokenExpiration
            );
GO
            -- Update user's last login
            UPDATE Users
            SET 
                LastLoginDate = GETDATE(),
                AvatarURL = ISNULL(AvatarURL, @ProfilePictureURL)
            WHERE UserID = @UserID;
GO
        END
        
        COMMIT TRANSACTION;
GO
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
GO
        THROW;
GO
    END CATCH
END;
GO

-- sp_User_GetSocialLogins: Get all social logins for a user
CREATE PROCEDURE sp_User_GetSocialLogins
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
GO
    SELECT 
        usl.UserSocialLoginID,
        slp.ProviderName,
        usl.Email,
        usl.FirstName,
        usl.LastName,
        usl.ProfilePictureURL,
        usl.DateLinked,
        usl.LastLoginDate
    FROM 
        UserSocialLogins usl
        INNER JOIN SocialLoginProviders slp ON usl.ProviderID = slp.ProviderID
    WHERE 
        usl.UserID = @UserID;
GO
END;
GO

-- sp_UserSocialLogin_Unlink: Remove social login association
CREATE PROCEDURE sp_UserSocialLogin_Unlink
    @UserID INT,
    @ProviderName NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
GO
    DECLARE @ProviderID INT;
GO
    -- Get provider ID
    SELECT @ProviderID = ProviderID 
    FROM SocialLoginProviders 
    WHERE ProviderName = @ProviderName;
GO
    IF @ProviderID IS NULL
    BEGIN
        RAISERROR('Social login provider not supported.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Check if user has other login methods
    DECLARE @PasswordHash NVARCHAR(255);
GO
    DECLARE @SocialLoginCount INT;
GO
    SELECT @PasswordHash = PasswordHash FROM Users WHERE UserID = @UserID;
GO
    SELECT @SocialLoginCount = COUNT(*) FROM UserSocialLogins WHERE UserID = @UserID;
GO
    -- User must have at least one login method
    IF @PasswordHash IS NULL AND @SocialLoginCount <= 1
    BEGIN
        RAISERROR('Cannot unlink the only login method. Please set a password first.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Remove social login
    DELETE FROM UserSocialLogins 
    WHERE UserID = @UserID AND ProviderID = @ProviderID;
GO
END;
GO

