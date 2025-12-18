-- =============================================
-- Stored Procedure: sp_Analytics_GetVendorViewCount
-- Description: Gets vendor profile view count for a period
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Analytics_GetVendorViewCount]'))
    DROP PROCEDURE [dbo].[sp_Analytics_GetVendorViewCount];
GO

CREATE PROCEDURE [dbo].[sp_Analytics_GetVendorViewCount]
    @VendorProfileID INT,
    @DaysBack INT = 7
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) AS ViewCount
    FROM VendorProfileViews
    WHERE VendorProfileID = @VendorProfileID
      AND ViewedAt >= DATEADD(DAY, -@DaysBack, GETUTCDATE());
END
GO
