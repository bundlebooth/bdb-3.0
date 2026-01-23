-- =============================================
-- Stored Procedure: vendors.sp_GetFAQs
-- Description: Gets vendor FAQs
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetFAQs]'))
    DROP PROCEDURE [vendors].[sp_GetFAQs];
GO

CREATE PROCEDURE [vendors].[sp_GetFAQs]
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
