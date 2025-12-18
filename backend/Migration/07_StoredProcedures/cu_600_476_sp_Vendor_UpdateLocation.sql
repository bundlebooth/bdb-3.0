-- =============================================
-- Stored Procedure: vendors.sp_UpdateLocation
-- Description: Updates vendor location information
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateLocation]'))
    DROP PROCEDURE [vendors].[sp_UpdateLocation];
GO

CREATE PROCEDURE [vendors].[sp_UpdateLocation]
    @VendorProfileID INT,
    @Address NVARCHAR(255) = NULL,
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(100) = NULL,
    @Country NVARCHAR(100) = NULL,
    @PostalCode NVARCHAR(20) = NULL,
    @Latitude DECIMAL(10,8) = NULL,
    @Longitude DECIMAL(11,8) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET Address = @Address,
        City = @City,
        State = @State,
        Country = @Country,
        PostalCode = @PostalCode,
        Latitude = @Latitude,
        Longitude = @Longitude,
        UpdatedAt = GETUTCDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

