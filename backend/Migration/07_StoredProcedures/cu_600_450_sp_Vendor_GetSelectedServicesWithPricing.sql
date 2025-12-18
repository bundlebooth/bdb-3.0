-- =============================================
-- Stored Procedure: vendors.sp_GetSelectedServicesWithPricing
-- Description: Gets vendor's selected services with unified pricing
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetSelectedServicesWithPricing]'))
    DROP PROCEDURE [vendors].[sp_GetSelectedServicesWithPricing];
GO

CREATE PROCEDURE [vendors].[sp_GetSelectedServicesWithPricing]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        s.ServiceID AS VendorSelectedServiceID,
        s.LinkedPredefinedServiceID AS PredefinedServiceID,
        ps.ServiceName,
        ps.ServiceDescription as PredefinedDescription,
        ps.Category,
        ps.DefaultDurationMinutes,
        s.Description AS VendorDescription,
        CASE 
            WHEN s.PricingModel = 'time_based' THEN s.BaseRate
            WHEN s.PricingModel = 'fixed_based' AND s.FixedPricingType = 'fixed_price' THEN s.FixedPrice
            WHEN s.PricingModel = 'fixed_based' AND s.FixedPricingType = 'per_attendee' THEN s.PricePerPerson
            ELSE s.Price
        END AS VendorPrice,
        COALESCE(s.BaseDurationMinutes, s.DurationMinutes, ps.DefaultDurationMinutes) AS VendorDurationMinutes,
        NULL AS ImageURL,
        s.CreatedAt,
        s.UpdatedAt,
        s.IsActive,
        s.PricingModel,
        s.BaseRate,
        s.BaseDurationMinutes,
        s.OvertimeRatePerHour,
        s.MinimumBookingFee,
        s.FixedPricingType,
        s.FixedPrice,
        s.PricePerPerson,
        s.MinimumAttendees,
        s.MaximumAttendees
    FROM vendors.Services s
    LEFT JOIN admin.PredefinedServices ps ON ps.PredefinedServiceID = s.LinkedPredefinedServiceID
    WHERE s.VendorProfileID = @VendorProfileID 
        AND s.LinkedPredefinedServiceID IS NOT NULL 
        AND s.IsActive = 1
    ORDER BY ps.Category, ps.ServiceName;
END
GO

