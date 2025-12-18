-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetFAQs
-- Description: Gets vendor FAQs
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetFAQs]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetFAQs];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetFAQs]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT FAQID, Question, Answer, AnswerType, AnswerOptions, DisplayOrder, IsActive 
    FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
END
GO
