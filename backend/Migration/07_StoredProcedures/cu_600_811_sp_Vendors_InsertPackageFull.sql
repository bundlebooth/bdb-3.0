-- =============================================
-- Vendors - Insert Package Full
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('vendors.sp_InsertPackageFull', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_InsertPackageFull;
GO

CREATE PROCEDURE vendors.sp_InsertPackageFull
    @VendorProfileID INT,
    @PackageName NVARCHAR(255),
    @Description NVARCHAR(MAX),
    @Price DECIMAL(10,2),
    @SalePrice DECIMAL(10,2),
    @PriceType NVARCHAR(50),
    @DurationMinutes INT,
    @ImageURL NVARCHAR(500),
    @FinePrint NVARCHAR(MAX),
    @IncludedServices NVARCHAR(MAX),
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.Packages (VendorProfileID, PackageName, Description, Price, SalePrice, PriceType, DurationMinutes, ImageURL, FinePrint, IncludedServices, IsActive, CreatedAt, UpdatedAt)
    OUTPUT INSERTED.PackageID
    VALUES (@VendorProfileID, @PackageName, @Description, @Price, @SalePrice, @PriceType, @DurationMinutes, @ImageURL, @FinePrint, @IncludedServices, @IsActive, GETDATE(), GETDATE());
END
GO
