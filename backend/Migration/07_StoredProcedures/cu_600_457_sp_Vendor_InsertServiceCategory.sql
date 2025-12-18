-- =============================================
-- Stored Procedure: vendors.sp_InsertServiceCategory
-- Description: Inserts a service category for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertServiceCategory]'))
    DROP PROCEDURE [vendors].[sp_InsertServiceCategory];
GO

CREATE PROCEDURE [vendors].[sp_InsertServiceCategory]
    @VendorProfileID INT,
    @Name NVARCHAR(100),
    @Description NVARCHAR(MAX) = NULL,
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO ServiceCategories (VendorProfileID, Name, Description, DisplayOrder)
    VALUES (@VendorProfileID, @Name, @Description, @DisplayOrder);
    
    SELECT SCOPE_IDENTITY() AS CategoryID;
END
GO
