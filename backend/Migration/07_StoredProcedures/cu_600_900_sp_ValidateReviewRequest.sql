/*
    Migration Script: Create Stored Procedure [sp_ValidateReviewRequest]
    Phase: 600 - Stored Procedures
    Script: cu_600_900_sp_ValidateReviewRequest.sql
    Description: Validates if a booking can be reviewed (for review deeplink)
    
    Execution Order: 900
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_ValidateReviewRequest]...';
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[sp_ValidateReviewRequest]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [vendors].[sp_ValidateReviewRequest];
GO

CREATE PROCEDURE [vendors].[sp_ValidateReviewRequest]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @EventDate DATE;
    DECLARE @IsPaid BIT;
    DECLARE @AlreadyReviewed BIT = 0;
    DECLARE @Expired BIT = 0;
    DECLARE @IsCompleted BIT = 0;
    
    -- Check if booking exists and get details
    SELECT 
        @EventDate = b.EventDate,
        @IsPaid = CASE WHEN b.FullAmountPaid = 1 THEN 1 ELSE 0 END
    FROM bookings.Bookings b
    WHERE b.BookingID = @BookingID;
    
    IF @EventDate IS NULL
    BEGIN
        -- Booking not found
        SELECT 
            NULL AS BookingID,
            0 AS AlreadyReviewed,
            0 AS Expired,
            0 AS IsCompleted,
            0 AS IsPaid;
        RETURN;
    END
    
    -- Check if event has completed (date has passed)
    IF @EventDate < CAST(GETDATE() AS DATE)
        SET @IsCompleted = 1;
    
    -- Check if review link has expired (30 days after event)
    IF DATEDIFF(DAY, @EventDate, GETDATE()) > 30
        SET @Expired = 1;
    
    -- Check if already reviewed
    IF EXISTS (
        SELECT 1 FROM vendors.Reviews r
        WHERE r.BookingID = @BookingID
    )
        SET @AlreadyReviewed = 1;
    
    -- Return validation result with booking details
    SELECT 
        b.BookingID AS BookingID,
        b.VendorProfileID,
        vp.BusinessName AS VendorName,
        vp.LogoURL AS VendorLogo,
        COALESCE(s.Name, 'Service') AS ServiceName,
        b.EventDate,
        b.EventLocation,
        b.TotalAmount,
        @AlreadyReviewed AS AlreadyReviewed,
        @Expired AS Expired,
        @IsCompleted AS IsCompleted,
        @IsPaid AS IsPaid
    FROM bookings.Bookings b
    INNER JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    LEFT JOIN vendors.Services s ON b.ServiceID = s.ServiceID
    WHERE b.BookingID = @BookingID;
END
GO

PRINT 'Stored procedure [vendors].[sp_ValidateReviewRequest] created successfully.';
GO
