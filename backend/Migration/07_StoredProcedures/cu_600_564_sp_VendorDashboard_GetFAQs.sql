-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetFAQs
-- Description: Gets vendor FAQs
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetFAQs]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetFAQs];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetFAQs]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT FAQID, Question, Answer, AnswerType, AnswerOptions, DisplayOrder, IsActive 
    FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
END
GO
