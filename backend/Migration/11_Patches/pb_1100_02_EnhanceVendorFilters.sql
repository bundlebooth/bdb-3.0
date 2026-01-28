/*
    Migration Script: Enhance Vendor Filters
    Phase: 1100 - Patches
    Script: pb_1100_02_EnhanceVendorFilters.sql
    Description: 
        - Removes AffordabilityLevel column (replaced by BasePrice range slider)
        - Adds columns for enhanced filtering
        - Updates stored procedure for new filter parameters
    
    Date: 2026-01-28
*/

SET NOCOUNT ON;
GO

PRINT '=== Starting Vendor Filter Enhancement Migration ===';
GO

-- ============================================
-- STEP 1: Remove AffordabilityLevel column
-- ============================================
PRINT 'Step 1: Removing AffordabilityLevel column...';
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'AffordabilityLevel')
BEGIN
    ALTER TABLE [vendors].[VendorProfiles] DROP COLUMN [AffordabilityLevel];
    PRINT '  - Dropped AffordabilityLevel column';
END
ELSE
BEGIN
    PRINT '  - AffordabilityLevel column does not exist, skipping';
END
GO

-- ============================================
-- STEP 2: Ensure BasePrice column exists with proper default
-- ============================================
PRINT 'Step 2: Ensuring BasePrice column exists...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'BasePrice')
BEGIN
    ALTER TABLE [vendors].[VendorProfiles] ADD [BasePrice] DECIMAL(10, 2) NULL;
    PRINT '  - Added BasePrice column';
END
ELSE
BEGIN
    PRINT '  - BasePrice column already exists';
END
GO

-- ============================================
-- STEP 3: Ensure InstantBookingEnabled column exists
-- ============================================
PRINT 'Step 3: Ensuring InstantBookingEnabled column exists...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'InstantBookingEnabled')
BEGIN
    ALTER TABLE [vendors].[VendorProfiles] ADD [InstantBookingEnabled] BIT CONSTRAINT DF_VendorProfiles_InstantBookingEnabled DEFAULT 0 NOT NULL;
    PRINT '  - Added InstantBookingEnabled column';
END
ELSE
BEGIN
    PRINT '  - InstantBookingEnabled column already exists';
END
GO

-- ============================================
-- STEP 4: Populate BasePrice from minimum service price where NULL
-- ============================================
PRINT 'Step 4: Populating BasePrice from minimum service prices...';
GO

UPDATE vp
SET vp.BasePrice = MinSvc.MinPrice
FROM [vendors].[VendorProfiles] vp
OUTER APPLY (
    SELECT TOP 1 
        COALESCE(
            CASE WHEN s.PricingModel = 'time_based' THEN NULLIF(ISNULL(s.MinimumBookingFee, 0), 0) ELSE NULL END,
            CASE 
                WHEN s.PricingModel = 'time_based' THEN s.BaseRate
                WHEN s.PricingModel = 'fixed_based' AND s.FixedPricingType = 'fixed_price' THEN s.FixedPrice
                WHEN s.PricingModel = 'fixed_based' AND s.FixedPricingType = 'per_attendee' THEN s.PricePerPerson
                ELSE s.Price
            END,
            0
        ) AS MinPrice
    FROM [vendors].[Services] s
    WHERE s.VendorProfileID = vp.VendorProfileID AND s.IsActive = 1
    ORDER BY COALESCE(
        CASE WHEN s.PricingModel = 'time_based' THEN NULLIF(ISNULL(s.MinimumBookingFee, 0), 0) ELSE NULL END,
        CASE 
            WHEN s.PricingModel = 'time_based' THEN s.BaseRate
            WHEN s.PricingModel = 'fixed_based' AND s.FixedPricingType = 'fixed_price' THEN s.FixedPrice
            WHEN s.PricingModel = 'fixed_based' AND s.FixedPricingType = 'per_attendee' THEN s.PricePerPerson
            ELSE s.Price
        END,
        999999
    ) ASC
) AS MinSvc
WHERE vp.BasePrice IS NULL AND MinSvc.MinPrice IS NOT NULL AND MinSvc.MinPrice > 0;

PRINT '  - Updated BasePrice for vendors with NULL values';
GO

PRINT '=== Vendor Filter Enhancement Migration Complete ===';
GO
