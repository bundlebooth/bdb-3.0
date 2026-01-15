-- =============================================
-- Vendors - Update Package Full
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('vendors.sp_UpdatePackageFull', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_UpdatePackageFull;
GO

CREATE PROCEDURE vendors.sp_UpdatePackageFull
    @PackageID INT,
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
    
    UPDATE vendors.Packages SET
        PackageName = @PackageName,
        Description = @Description,
        Price = @Price,
        SalePrice = @SalePrice,
        PriceType = @PriceType,
        DurationMinutes = @DurationMinutes,
        ImageURL = @ImageURL,
        FinePrint = @FinePrint,
        IncludedServices = @IncludedServices,
        IsActive = @IsActive,
        UpdatedAt = GETDATE()
    WHERE PackageID = @PackageID AND VendorProfileID = @VendorProfileID;
END
GO
