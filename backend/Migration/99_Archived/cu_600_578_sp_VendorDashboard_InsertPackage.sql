-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_InsertPackage
-- Description: Inserts a package
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_InsertPackage]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_InsertPackage];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_InsertPackage]
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
