/*
    Migration Script: Create Stored Procedure [users].[sp_Register]
    Description: Registers a new user with default values to prevent NULLs
    
    Execution Order: 720
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_Register]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_Register]'))
    DROP PROCEDURE [users].[sp_Register];
GO

CREATE PROCEDURE [users].[sp_Register]
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
            '', '', '', '', 
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
                @UserID, @Name, '', '', 
                '', '', '', 
                0, 0, 0, 
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

PRINT 'Stored procedure [users].[sp_Register] created successfully.';
GO
