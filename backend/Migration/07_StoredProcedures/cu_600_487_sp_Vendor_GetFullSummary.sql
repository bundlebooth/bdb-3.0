-- =============================================
-- Stored Procedure: sp_Vendor_GetFullSummary
-- Description: Gets full vendor summary for Step 9
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetFullSummary]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetFullSummary];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetFullSummary]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get vendor profile data
    SELECT * FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
    
    -- Get category answers
    SELECT ca.*, cq.QuestionText, cq.Category 
    FROM VendorCategoryAnswers ca
    JOIN CategoryQuestions cq ON ca.QuestionID = cq.QuestionID
    WHERE ca.VendorProfileID = @VendorProfileID;
    
    -- Get business hours
    SELECT * FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID ORDER BY DayOfWeek;
    
    -- Get gallery images
    SELECT * FROM VendorImages WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
    
    -- Get social media
    SELECT * FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
    
    -- Get FAQs
    SELECT * FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
END
GO
