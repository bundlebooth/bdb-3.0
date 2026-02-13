/*
    Migration Script: Stored Procedure - Get Vendors With Badge Eligibility
    Phase: 700 - Stored Procedures
    Script: pb_700_401_sp_VendorBadges_GetVendorsWithEligibility.sql
    Description: Gets all vendors with their badge eligibility status for admin management
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[sp_VendorBadges_GetVendorsWithEligibility]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [vendors].[sp_VendorBadges_GetVendorsWithEligibility];
GO

CREATE PROCEDURE [vendors].[sp_VendorBadges_GetVendorsWithEligibility]
    @BadgeID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get badge criteria if specific badge requested
    DECLARE @MinRating DECIMAL(3,2), @MinReviews INT, @MinBookings INT, 
            @MinResponseRate INT, @MaxDaysOld INT, @MinResponseTimeMinutes INT;
    
    IF @BadgeID IS NOT NULL
    BEGIN
        SELECT 
            @MinRating = EligibilityMinRating,
            @MinReviews = EligibilityMinReviews,
            @MinBookings = EligibilityMinBookings,
            @MinResponseRate = EligibilityMinResponseRate,
            @MaxDaysOld = EligibilityMaxDaysOld,
            @MinResponseTimeMinutes = EligibilityMinResponseTimeMinutes
        FROM [vendors].[VendorBadges]
        WHERE BadgeID = @BadgeID;
    END
    
    SELECT 
        vp.VendorProfileID,
        vp.BusinessName,
        vp.City,
        vp.State,
        vp.LogoURL,
        u.FirstName + ' ' + u.LastName AS OwnerName,
        u.Email AS OwnerEmail,
        
        -- Stats for eligibility calculation
        COALESCE(vp.AvgRating, 0) AS AvgRating,
        COALESCE(vp.TotalReviews, 0) AS TotalReviews,
        COALESCE((SELECT COUNT(*) FROM [bookings].[Bookings] b WHERE b.VendorProfileID = vp.VendorProfileID AND b.Status IN ('Confirmed', 'Completed')), 0) AS TotalBookings,
        COALESCE(vp.ResponseRate, 0) AS ResponseRate,
        COALESCE(vp.AvgResponseTimeMinutes, 999) AS AvgResponseTimeMinutes,
        DATEDIFF(DAY, vp.CreatedAt, GETDATE()) AS DaysOld,
        
        -- Check if vendor has this specific badge
        CASE WHEN EXISTS (
            SELECT 1 FROM [vendors].[VendorBadgeGrants] bg 
            WHERE bg.VendorProfileID = vp.VendorProfileID 
            AND bg.BadgeID = @BadgeID 
            AND bg.IsActive = 1
        ) THEN 1 ELSE 0 END AS HasBadge,
        
        -- Check eligibility based on criteria
        CASE 
            WHEN @BadgeID IS NULL THEN 0
            WHEN (@MinRating IS NULL OR COALESCE(vp.AvgRating, 0) >= @MinRating)
                AND (@MinReviews IS NULL OR COALESCE(vp.TotalReviews, 0) >= @MinReviews)
                AND (@MinBookings IS NULL OR COALESCE((SELECT COUNT(*) FROM [bookings].[Bookings] b WHERE b.VendorProfileID = vp.VendorProfileID AND b.Status IN ('Confirmed', 'Completed')), 0) >= @MinBookings)
                AND (@MinResponseRate IS NULL OR COALESCE(vp.ResponseRate, 0) >= @MinResponseRate)
                AND (@MaxDaysOld IS NULL OR DATEDIFF(DAY, vp.CreatedAt, GETDATE()) <= @MaxDaysOld)
                AND (@MinResponseTimeMinutes IS NULL OR COALESCE(vp.AvgResponseTimeMinutes, 999) <= @MinResponseTimeMinutes)
            THEN 1 
            ELSE 0 
        END AS MeetsEligibility,
        
        -- Get all active badges for this vendor
        (
            SELECT STRING_AGG(b.BadgeKey, ',') 
            FROM [vendors].[VendorBadgeGrants] bg
            JOIN [vendors].[VendorBadges] b ON bg.BadgeID = b.BadgeID
            WHERE bg.VendorProfileID = vp.VendorProfileID AND bg.IsActive = 1
        ) AS ActiveBadges
        
    FROM [vendors].[VendorProfiles] vp
    JOIN [users].[Users] u ON vp.UserID = u.UserID
    WHERE vp.IsVisible = 1 AND vp.ApprovalStatus = 'Approved'
    ORDER BY vp.BusinessName;
END
GO

PRINT 'Created stored procedure: [vendors].[sp_VendorBadges_GetVendorsWithEligibility]';
GO
