-- =============================================
-- Stored Procedure: vendors.sp_UpdateLocationProfile
-- Description: Updates vendor profile location
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateLocationProfile]'))
    DROP PROCEDURE [vendors].[sp_UpdateLocationProfile];
GO

CREATE PROCEDURE [vendors].[sp_UpdateLocationProfile]
    @VendorProfileID INT,
    @Address NVARCHAR(255) = NULL,
    @City NVARCHAR(100) = '',
    @State NVARCHAR(50) = '',
    @Country NVARCHAR(50) = 'Canada',
    @PostalCode NVARCHAR(20) = NULL,
    @Latitude DECIMAL(10,8) = NULL,
    @Longitude DECIMAL(11,8) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles
    SET Address = @Address, City = @City, State = @State, Country = @Country,
        PostalCode = @PostalCode, Latitude = @Latitude, Longitude = @Longitude,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

