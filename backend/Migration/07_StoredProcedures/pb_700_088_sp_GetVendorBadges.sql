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
        b.BadgeID,
        bg.VendorProfileID,
        b.BadgeKey AS BadgeType,
        b.BadgeName,
        YEAR(bg.GrantedAt) AS [Year],
        NULL AS ImageURL,
        b.BadgeDescription AS Description,
        bg.IsActive,
        bg.GrantedAt AS CreatedAt,
        bg.GrantedAt AS UpdatedAt
    FROM [vendors].[VendorBadgeGrants] bg
    JOIN [vendors].[VendorBadges] b ON bg.BadgeID = b.BadgeID
    WHERE bg.VendorProfileID = @VendorProfileID 
      AND bg.IsActive = 1 
      AND b.IsActive = 1
      AND (bg.ExpiresAt IS NULL OR bg.ExpiresAt > GETDATE())
    ORDER BY bg.GrantedAt DESC;
END
GO
