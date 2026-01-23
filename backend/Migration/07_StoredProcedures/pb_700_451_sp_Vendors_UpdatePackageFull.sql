-- =============================================
-- Vendors - Update Package Full
-- Created: API Audit - Security Enhancement
-- Updated: Added pricing model columns (BaseRate, OvertimeRate, FixedPrice, PricePerPerson, MinAttendees, MaxAttendees)
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
    @IsActive BIT,
    @BaseRate DECIMAL(10,2) = NULL,
    @OvertimeRate DECIMAL(10,2) = NULL,
    @FixedPrice DECIMAL(10,2) = NULL,
    @PricePerPerson DECIMAL(10,2) = NULL,
    @MinAttendees INT = NULL,
    @MaxAttendees INT = NULL
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
        BaseRate = @BaseRate,
        OvertimeRate = @OvertimeRate,
        FixedPrice = @FixedPrice,
        PricePerPerson = @PricePerPerson,
        MinAttendees = @MinAttendees,
        MaxAttendees = @MaxAttendees,
        UpdatedAt = GETDATE()
    WHERE PackageID = @PackageID AND VendorProfileID = @VendorProfileID;
END
GO
