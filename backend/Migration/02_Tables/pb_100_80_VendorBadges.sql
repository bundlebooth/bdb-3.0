/*
    Migration Script: Create Table [vendors].[VendorBadges]
    Phase: 100 - Tables
    Script: pb_100_80_VendorBadges.sql
    Description: Creates the VendorBadges table for storing badge definitions
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorBadges]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorBadges] (
        BadgeID INT IDENTITY(1,1) PRIMARY KEY,
        BadgeKey NVARCHAR(50) NOT NULL UNIQUE,
        BadgeName NVARCHAR(100) NOT NULL,
        BadgeDescription NVARCHAR(500),
        BadgeIcon NVARCHAR(100),
        BadgeColor NVARCHAR(20),
        -- Eligibility criteria (NULL means not applicable for auto-eligibility)
        EligibilityMinRating DECIMAL(3,2),
        EligibilityMinReviews INT,
        EligibilityMinBookings INT,
        EligibilityMinResponseRate INT,
        EligibilityMaxDaysOld INT,  -- For "New Vendor" badge - vendor must be registered within X days
        EligibilityMinResponseTimeMinutes INT,  -- For "Quick Responder" badge
        -- Display settings
        DisplayOrder INT DEFAULT 0,
        IsAutoGranted BIT DEFAULT 0,  -- If true, badge is auto-granted when criteria met
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
    );
    
    PRINT 'Created table: [vendors].[VendorBadges]';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorBadges] already exists';
END
GO

-- Insert default badge types
IF NOT EXISTS (SELECT 1 FROM [vendors].[VendorBadges] WHERE BadgeKey = 'top_rated')
BEGIN
    INSERT INTO [vendors].[VendorBadges] (BadgeKey, BadgeName, BadgeDescription, BadgeIcon, BadgeColor, EligibilityMinRating, EligibilityMinReviews, DisplayOrder, IsAutoGranted)
    VALUES ('top_rated', 'Top Rated', 'Consistently receives excellent reviews from clients', 'fa-star', '#FFB400', 4.8, 10, 1, 0);
END

IF NOT EXISTS (SELECT 1 FROM [vendors].[VendorBadges] WHERE BadgeKey = 'new_vendor')
BEGIN
    INSERT INTO [vendors].[VendorBadges] (BadgeKey, BadgeName, BadgeDescription, BadgeIcon, BadgeColor, EligibilityMaxDaysOld, DisplayOrder, IsAutoGranted)
    VALUES ('new_vendor', 'New Vendor', 'Recently joined the PlanBeau community', 'fa-sparkles', '#10B981', 30, 2, 1);
END

IF NOT EXISTS (SELECT 1 FROM [vendors].[VendorBadges] WHERE BadgeKey = 'quick_responder')
BEGIN
    INSERT INTO [vendors].[VendorBadges] (BadgeKey, BadgeName, BadgeDescription, BadgeIcon, BadgeColor, EligibilityMinResponseRate, EligibilityMinResponseTimeMinutes, DisplayOrder, IsAutoGranted)
    VALUES ('quick_responder', 'Quick Responder', 'Responds to inquiries within 1 hour on average', 'fa-bolt', '#00A699', 95, 60, 3, 0);
END

IF NOT EXISTS (SELECT 1 FROM [vendors].[VendorBadges] WHERE BadgeKey = 'most_booked')
BEGIN
    INSERT INTO [vendors].[VendorBadges] (BadgeKey, BadgeName, BadgeDescription, BadgeIcon, BadgeColor, EligibilityMinBookings, DisplayOrder, IsAutoGranted)
    VALUES ('most_booked', 'Most Booked', 'One of the most popular vendors on PlanBeau', 'fa-calendar-check', '#EC4899', 50, 4, 0);
END

IF NOT EXISTS (SELECT 1 FROM [vendors].[VendorBadges] WHERE BadgeKey = 'eco_friendly')
BEGIN
    INSERT INTO [vendors].[VendorBadges] (BadgeKey, BadgeName, BadgeDescription, BadgeIcon, BadgeColor, DisplayOrder, IsAutoGranted)
    VALUES ('eco_friendly', 'Eco-Friendly', 'Committed to sustainable and eco-friendly practices', 'fa-leaf', '#22C55E', 5, 0);
END

IF NOT EXISTS (SELECT 1 FROM [vendors].[VendorBadges] WHERE BadgeKey = 'award_winner')
BEGIN
    INSERT INTO [vendors].[VendorBadges] (BadgeKey, BadgeName, BadgeDescription, BadgeIcon, BadgeColor, DisplayOrder, IsAutoGranted)
    VALUES ('award_winner', 'Award Winner', 'Recognized for excellence in their field', 'fa-trophy', '#F59E0B', 6, 0);
END

IF NOT EXISTS (SELECT 1 FROM [vendors].[VendorBadges] WHERE BadgeKey = 'verified')
BEGIN
    INSERT INTO [vendors].[VendorBadges] (BadgeKey, BadgeName, BadgeDescription, BadgeIcon, BadgeColor, DisplayOrder, IsAutoGranted)
    VALUES ('verified', 'Verified', 'Identity and business credentials verified by PlanBeau', 'fa-check-circle', '#3B82F6', 7, 0);
END

IF NOT EXISTS (SELECT 1 FROM [vendors].[VendorBadges] WHERE BadgeKey = 'premium_partner')
BEGIN
    INSERT INTO [vendors].[VendorBadges] (BadgeKey, BadgeName, BadgeDescription, BadgeIcon, BadgeColor, DisplayOrder, IsAutoGranted)
    VALUES ('premium_partner', 'Premium Partner', 'Official PlanBeau premium partner', 'fa-crown', '#8B5CF6', 8, 0);
END

PRINT 'Default badge types inserted';
GO
