/*
    Migration Script: Create Stored Procedure [vendors].[sp_RefreshVendorStats]
    Description: Refreshes TotalBookings, TotalReviews, AvgRating, and LastReviewDate
                 for a specific vendor or all vendors
    
    Execution Order: 717
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_RefreshVendorStats]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_RefreshVendorStats]'))
    DROP PROCEDURE [vendors].[sp_RefreshVendorStats];
GO

CREATE PROCEDURE [vendors].[sp_RefreshVendorStats]
    @VendorProfileID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update TotalBookings
    UPDATE vp
    SET TotalBookings = ISNULL(b.BookingCount, 0)
    FROM vendors.VendorProfiles vp
    LEFT JOIN (
        SELECT VendorProfileID, COUNT(*) AS BookingCount
        FROM bookings.Bookings
        WHERE Status IN ('paid', 'completed')
        GROUP BY VendorProfileID
    ) b ON vp.VendorProfileID = b.VendorProfileID
    WHERE @VendorProfileID IS NULL OR vp.VendorProfileID = @VendorProfileID;
    
    -- Update TotalReviews and AvgRating
    UPDATE vp
    SET TotalReviews = ISNULL(r.ReviewCount, 0),
        AvgRating = r.AvgRating,
        LastReviewDate = r.LastReviewDate
    FROM vendors.VendorProfiles vp
    LEFT JOIN (
        SELECT VendorProfileID, 
               COUNT(*) AS ReviewCount, 
               AVG(CAST(Rating AS DECIMAL(3,2))) AS AvgRating,
               MAX(CreatedAt) AS LastReviewDate
        FROM vendors.Reviews
        GROUP BY VendorProfileID
    ) r ON vp.VendorProfileID = r.VendorProfileID
    WHERE @VendorProfileID IS NULL OR vp.VendorProfileID = @VendorProfileID;
    
    SELECT 'Stats refreshed' AS Result;
END;
GO

PRINT 'Stored procedure [vendors].[sp_RefreshVendorStats] created successfully.';
GO
