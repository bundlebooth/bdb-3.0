-- =============================================
-- Stored Procedure: Get Vendor Badges
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetVendorBadges]') AND type in (N'P'))
    DROP PROCEDURE [vendors].[sp_GetVendorBadges];
GO

CREATE PROCEDURE [vendors].[sp_GetVendorBadges]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        BadgeID,
        VendorProfileID,
        BadgeType,
        BadgeName,
        [Year],
        ImageURL,
        Description,
        IsActive,
        CreatedAt,
        UpdatedAt
    FROM [vendors].[VendorBadges]
    WHERE VendorProfileID = @VendorProfileID AND IsActive = 1
    ORDER BY CreatedAt DESC;
END
GO
