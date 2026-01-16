-- =============================================
-- Vendors - Insert Package Full
-- Created: API Audit - Security Enhancement
-- Updated: Added pricing model columns (BaseRate, OvertimeRate, FixedPrice, PricePerPerson, MinAttendees, MaxAttendees)
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
    
    INSERT INTO vendors.Packages (VendorProfileID, PackageName, Description, Price, SalePrice, PriceType, DurationMinutes, ImageURL, FinePrint, IncludedServices, IsActive, CreatedAt, UpdatedAt, BaseRate, OvertimeRate, FixedPrice, PricePerPerson, MinAttendees, MaxAttendees)
    OUTPUT INSERTED.PackageID
    VALUES (@VendorProfileID, @PackageName, @Description, @Price, @SalePrice, @PriceType, @DurationMinutes, @ImageURL, @FinePrint, @IncludedServices, @IsActive, GETDATE(), GETDATE(), @BaseRate, @OvertimeRate, @FixedPrice, @PricePerPerson, @MinAttendees, @MaxAttendees);
END
GO
