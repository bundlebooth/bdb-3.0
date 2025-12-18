-- =============================================
-- Stored Procedure: vendors.sp_GetFullSummary
-- Description: Gets full vendor summary for Step 9
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetFullSummary]'))
    DROP PROCEDURE [vendors].[sp_GetFullSummary];
GO

CREATE PROCEDURE [vendors].[sp_GetFullSummary]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get vendor profile data
    SELECT * FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
    
    -- Get category answers
    SELECT ca.*, cq.QuestionText, cq.Category 
    FROM VendorCategoryAnswers ca
    JOIN CategoryQuestions cq ON ca.QuestionID = cq.QuestionID
    WHERE ca.VendorProfileID = @VendorProfileID;
    
    -- Get business hours
    SELECT * FROM vendors.VendorBusinessHours WHERE VendorProfileID = @VendorProfileID ORDER BY DayOfWeek;
    
    -- Get gallery images
    SELECT * FROM vendors.VendorImages WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
    
    -- Get social media
    SELECT * FROM vendors.VendorSocialMedia WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
    
    -- Get FAQs
    SELECT * FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
END
GO




