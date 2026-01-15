/*
    Migration Script: Create Stored Procedure [users].[sp_RegisterUser]
    Description: Registers a new user with default values to prevent NULLs
                 This is the SP called by the backend API
    
    Execution Order: 723
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_RegisterUser]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_RegisterUser]'))
    DROP PROCEDURE [users].[sp_RegisterUser];
GO

CREATE PROCEDURE [users].[sp_RegisterUser]
    @Name NVARCHAR(100),
    @Email NVARCHAR(100),
    @PasswordHash NVARCHAR(255),
    @IsVendor BIT = 0,
    @AuthProvider NVARCHAR(20) = 'email'
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Insert user with default values for optional fields to prevent NULLs
        INSERT INTO users.Users (
            Name, Email, PasswordHash, IsVendor, AuthProvider, 
            Phone, Bio, ProfileImageURL, StripeCustomerID, 
            CreatedAt, UpdatedAt
        )
        VALUES (
            @Name, @Email, @PasswordHash, @IsVendor, @AuthProvider, 
            '',   -- Phone default
            '',   -- Bio default
            '',   -- ProfileImageURL default
            '',   -- StripeCustomerID default
            GETDATE(), GETDATE()
        );

        DECLARE @UserID INT = SCOPE_IDENTITY();

        -- If vendor, create vendor profile with defaults
        IF @IsVendor = 1
        BEGIN
            INSERT INTO vendors.VendorProfiles (
                UserID, BusinessName, BusinessPhone, BusinessEmail, 
                Website, LogoURL, StripeAccountID, 
                AvgRating, TotalBookings, TotalReviews, 
                CreatedAt, UpdatedAt
            )
            VALUES (
                @UserID, @Name, 
                '',   -- BusinessPhone default
                '',   -- BusinessEmail default
                '',   -- Website default
                '',   -- LogoURL default
                '',   -- StripeAccountID default
                0,    -- AvgRating default
                0,    -- TotalBookings default
                0,    -- TotalReviews default
                GETDATE(), GETDATE()
            );
        END

        COMMIT TRANSACTION;

        SELECT @UserID AS UserID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT 'Stored procedure [users].[sp_RegisterUser] created successfully.';
GO
