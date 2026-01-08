-- =============================================
-- Stored Procedure: vendors.sp_UpdateProfile
-- Description: Updates vendor profile basic information
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateProfile]'))
    DROP PROCEDURE [vendors].[sp_UpdateProfile];
GO

CREATE PROCEDURE [vendors].[sp_UpdateProfile]
    @VendorProfileID INT,
    @BusinessName NVARCHAR(100),
    @DisplayName NVARCHAR(100),
    @BusinessDescription NVARCHAR(MAX) = NULL,
    @BusinessPhone NVARCHAR(20),
    @Website NVARCHAR(255) = NULL,
    @YearsInBusiness INT = 1,
    @Address NVARCHAR(255) = NULL,
    @City NVARCHAR(100),
    @State NVARCHAR(50),
    @Country NVARCHAR(50) = 'Canada',
    @PostalCode NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles SET
        BusinessName = @BusinessName,
        DisplayName = @DisplayName,
        BusinessDescription = @BusinessDescription,
        BusinessPhone = @BusinessPhone,
        Website = @Website,
        YearsInBusiness = @YearsInBusiness,
        Address = @Address,
        City = @City,
        State = @State,
        Country = @Country,
        PostalCode = @PostalCode,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

