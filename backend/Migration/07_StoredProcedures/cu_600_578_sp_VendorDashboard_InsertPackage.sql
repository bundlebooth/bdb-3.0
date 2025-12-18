-- =============================================
-- Stored Procedure: sp_VendorDashboard_InsertPackage
-- Description: Inserts a package
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_InsertPackage]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_InsertPackage];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_InsertPackage]
    @VendorProfileID INT,
    @Name NVARCHAR(100),
    @Description NVARCHAR(MAX),
    @Price DECIMAL(10,2),
    @DurationMinutes INT,
    @MaxGuests INT,
    @WhatsIncluded NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Packages (VendorProfileID, Name, Description, Price, DurationMinutes, MaxGuests, WhatsIncluded)
    OUTPUT INSERTED.PackageID
    VALUES (@VendorProfileID, @Name, @Description, @Price, @DurationMinutes, @MaxGuests, @WhatsIncluded);
END
GO
