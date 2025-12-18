-- =============================================
-- Stored Procedure: vendors.sp_InsertFAQ
-- Description: Inserts a FAQ for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertFAQ]'))
    DROP PROCEDURE [vendors].[sp_InsertFAQ];
GO

CREATE PROCEDURE [vendors].[sp_InsertFAQ]
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
