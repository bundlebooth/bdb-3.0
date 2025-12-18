-- =============================================
-- Stored Procedure: sp_Vendor_InsertPackage
-- Description: Inserts a package for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertPackage]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertPackage];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertPackage]
    @VendorProfileID INT,
    @Name NVARCHAR(100),
    @Description NVARCHAR(MAX) = NULL,
    @Price DECIMAL(10,2),
    @DurationMinutes INT = NULL,
    @MaxGuests INT = NULL,
    @WhatsIncluded NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Packages (VendorProfileID, Name, Description, Price, DurationMinutes, MaxGuests, WhatsIncluded)
    VALUES (@VendorProfileID, @Name, @Description, @Price, @DurationMinutes, @MaxGuests, @WhatsIncluded);
    
    SELECT SCOPE_IDENTITY() AS PackageID;
END
GO
