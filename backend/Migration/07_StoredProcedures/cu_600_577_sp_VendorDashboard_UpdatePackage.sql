-- =============================================
-- Stored Procedure: sp_VendorDashboard_UpdatePackage
-- Description: Updates a package
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_UpdatePackage]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_UpdatePackage];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_UpdatePackage]
    @PackageID INT,
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
    
    UPDATE Packages SET Name=@Name, Description=@Description, Price=@Price, DurationMinutes=@DurationMinutes,
        MaxGuests=@MaxGuests, WhatsIncluded=@WhatsIncluded
    WHERE PackageID=@PackageID AND VendorProfileID=@VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
