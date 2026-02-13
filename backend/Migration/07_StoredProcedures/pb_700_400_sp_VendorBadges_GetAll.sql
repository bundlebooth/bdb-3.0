/*
    Migration Script: Stored Procedure - Get All Vendor Badges
    Phase: 700 - Stored Procedures
    Script: pb_700_400_sp_VendorBadges_GetAll.sql
    Description: Gets all badge definitions
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[sp_VendorBadges_GetAll]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [vendors].[sp_VendorBadges_GetAll];
GO

CREATE PROCEDURE [vendors].[sp_VendorBadges_GetAll]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        BadgeID,
        BadgeKey,
        BadgeName,
        BadgeDescription,
        BadgeIcon,
        BadgeColor,
        EligibilityMinRating,
        EligibilityMinReviews,
        EligibilityMinBookings,
        EligibilityMinResponseRate,
        EligibilityMaxDaysOld,
        EligibilityMinResponseTimeMinutes,
        DisplayOrder,
        IsAutoGranted,
        IsActive,
        CreatedAt
    FROM [vendors].[VendorBadges]
    WHERE IsActive = 1
    ORDER BY DisplayOrder, BadgeName;
END
GO

PRINT 'Created stored procedure: [vendors].[sp_VendorBadges_GetAll]';
GO
