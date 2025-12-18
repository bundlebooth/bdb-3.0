-- =============================================
-- Stored Procedure: sp_Vendor_InsertFAQ
-- Description: Inserts a FAQ for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertFAQ]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertFAQ];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertFAQ]
    @VendorProfileID INT,
    @Question NVARCHAR(500),
    @Answer NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorFAQs (VendorProfileID, Question, Answer, IsActive, CreatedAt)
    VALUES (@VendorProfileID, @Question, @Answer, 1, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS FAQID;
END
GO
