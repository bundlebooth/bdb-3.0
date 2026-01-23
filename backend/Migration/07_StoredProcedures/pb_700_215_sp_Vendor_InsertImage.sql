-- =============================================
-- Stored Procedure: vendors.sp_InsertImage
-- Description: Inserts an image for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertImage]'))
    DROP PROCEDURE [vendors].[sp_InsertImage];
GO

CREATE PROCEDURE [vendors].[sp_InsertImage]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500),
    @IsPrimary BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorImages (VendorProfileID, ImageURL, IsPrimary, CreatedAt)
    VALUES (@VendorProfileID, @ImageURL, @IsPrimary, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS ImageID;
END
GO

