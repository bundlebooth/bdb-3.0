/*
    Migration Script: Stored Procedure - Get Badges for a Vendor
    Phase: 700 - Stored Procedures
    Script: pb_700_404_sp_VendorBadges_GetByVendor.sql
    Description: Gets all active badges for a specific vendor
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[sp_VendorBadges_GetByVendor]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [vendors].[sp_VendorBadges_GetByVendor];
GO

CREATE PROCEDURE [vendors].[sp_VendorBadges_GetByVendor]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BadgeID,
        b.BadgeKey,
        b.BadgeName,
        b.BadgeDescription,
        b.BadgeIcon,
        b.BadgeColor,
        bg.GrantedAt,
        bg.ExpiresAt
    FROM [vendors].[VendorBadgeGrants] bg
    JOIN [vendors].[VendorBadges] b ON bg.BadgeID = b.BadgeID
    WHERE bg.VendorProfileID = @VendorProfileID 
      AND bg.IsActive = 1
      AND b.IsActive = 1
      AND (bg.ExpiresAt IS NULL OR bg.ExpiresAt > GETDATE())
    ORDER BY b.DisplayOrder, b.BadgeName;
END
GO

PRINT 'Created stored procedure: [vendors].[sp_VendorBadges_GetByVendor]';
GO
