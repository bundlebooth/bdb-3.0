/*
    Migration Script: Create Stored Procedure [users.sp_Register]
    Phase: 600 - Stored Procedures
    Script: cu_600_084_sp_RegisterUser.sql
    Description: Creates the [users].[sp_Register] stored procedure
    Schema: users
    Execution Order: 84
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_Register]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
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
        
        -- Insert user
        INSERT INTO users.Users (Name, Email, PasswordHash, IsVendor, AuthProvider)
        VALUES (@Name, @Email, @PasswordHash, @IsVendor, @AuthProvider);
        
        DECLARE @UserID INT = SCOPE_IDENTITY();
        
        -- If vendor, create vendor profile
        IF @IsVendor = 1
        BEGIN
            INSERT INTO vendors.VendorProfiles (UserID, BusinessName)
            VALUES (@UserID, @Name);
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


