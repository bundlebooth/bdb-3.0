-- =============================================
-- Stored Procedure: sp_Vendor_UpdateProfileFull
-- Description: Updates vendor profile with all fields
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpdateProfileFull]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpdateProfileFull];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpdateProfileFull]
    @VendorProfileID INT,
    @BusinessName NVARCHAR(100),
    @BusinessDescription NVARCHAR(MAX) = NULL,
    @BusinessPhone NVARCHAR(20) = NULL,
    @Website NVARCHAR(255) = NULL,
    @YearsInBusiness INT = NULL,
    @Address NVARCHAR(255) = NULL,
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(50) = NULL,
    @Country NVARCHAR(50) = 'USA',
    @PostalCode NVARCHAR(20) = NULL,
    @IsPremium BIT = 0,
    @IsEcoFriendly BIT = 0,
    @IsAwardWinning BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET 
        BusinessName = @BusinessName,
        BusinessDescription = @BusinessDescription,
        BusinessPhone = @BusinessPhone,
        Website = @Website,
        YearsInBusiness = @YearsInBusiness,
        Address = @Address,
        City = @City,
        State = @State,
        Country = @Country,
        PostalCode = @PostalCode,
        IsPremium = @IsPremium,
        IsEcoFriendly = @IsEcoFriendly,
        IsAwardWinning = @IsAwardWinning,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
