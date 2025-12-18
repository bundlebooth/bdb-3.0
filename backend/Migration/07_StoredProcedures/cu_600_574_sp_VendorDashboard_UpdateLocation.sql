-- =============================================
-- Stored Procedure: sp_VendorDashboard_UpdateLocation
-- Description: Updates vendor location
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_UpdateLocation]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_UpdateLocation];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_UpdateLocation]
    @VendorProfileID INT,
    @Address NVARCHAR(255),
    @City NVARCHAR(100),
    @State NVARCHAR(100),
    @Country NVARCHAR(100),
    @PostalCode NVARCHAR(20),
    @Latitude DECIMAL(10,8),
    @Longitude DECIMAL(11,8)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles SET Address=@Address, City=@City, State=@State, Country=@Country, PostalCode=@PostalCode,
        Latitude=@Latitude, Longitude=@Longitude, UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
