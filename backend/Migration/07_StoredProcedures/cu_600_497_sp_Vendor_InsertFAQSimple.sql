-- =============================================
-- Stored Procedure: vendors.sp_InsertFAQSimple
-- Description: Inserts a FAQ for a vendor (simple version)
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertFAQSimple]'))
    DROP PROCEDURE [vendors].[sp_InsertFAQSimple];
GO

CREATE PROCEDURE [vendors].[sp_InsertFAQSimple]
    @VendorProfileID INT,
    @Question NVARCHAR(500),
    @Answer NVARCHAR(MAX),
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorFAQs (VendorProfileID, Question, Answer, DisplayOrder)
    VALUES (@VendorProfileID, @Question, @Answer, @DisplayOrder);
    
    SELECT SCOPE_IDENTITY() AS FAQID;
END
GO
