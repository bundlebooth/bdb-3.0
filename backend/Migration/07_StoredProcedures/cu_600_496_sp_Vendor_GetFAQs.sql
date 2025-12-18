-- =============================================
-- Stored Procedure: sp_Vendor_GetFAQs
-- Description: Gets vendor FAQs
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetFAQs]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetFAQs];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetFAQs]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT FAQID, Question, Answer, DisplayOrder
    FROM VendorFAQs
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DisplayOrder;
END
GO
