/*
    Migration Script: Create Stored Procedure [sp_GetPostEventReviewRequests]
    Phase: 600 - Stored Procedures
    Script: cu_600_901_sp_GetPostEventReviewRequests.sql
    Description: Gets completed bookings where event was yesterday for sending review request emails
    
    Execution Order: 901
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_GetPostEventReviewRequests]...';
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPostEventReviewRequests]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [admin].[sp_GetPostEventReviewRequests];
GO

CREATE PROCEDURE [admin].[sp_GetPostEventReviewRequests]
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Yesterday DATE = DATEADD(DAY, -1, CAST(GETDATE() AS DATE));
    
    -- Get bookings where:
    -- 1. Event date was yesterday
    -- 2. Booking is fully paid
    -- 3. No review has been submitted yet
    -- 4. No review request email has been sent yet (check email logs)
    SELECT 
        br.RequestID AS BookingID,
        br.VendorProfileID,
        vp.BusinessName AS VendorName,
        u.UserID AS ClientUserID,
        u.Email AS ClientEmail,
        COALESCE(u.FirstName, u.Username, 'Client') AS ClientName,
        br.EventDate,
        br.EventLocation,
        COALESCE(
            (SELECT TOP 1 s.ServiceName FROM vendors.Services s 
             WHERE s.VendorProfileID = br.VendorProfileID),
            'Service'
        ) AS ServiceName
    FROM bookings.BookingRequests br
    INNER JOIN vendors.VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
    INNER JOIN users.Users u ON br.UserID = u.UserID
    WHERE br.EventDate = @Yesterday
      AND br.FullAmountPaid = 1
      AND br.Status NOT IN ('cancelled', 'cancelled_by_client', 'cancelled_by_vendor', 'declined', 'expired')
      -- Exclude bookings that already have a review
      AND NOT EXISTS (
          SELECT 1 FROM vendors.Reviews r 
          WHERE r.BookingID = br.RequestID
      )
      -- Exclude bookings where review request email was already sent
      AND NOT EXISTS (
          SELECT 1 FROM admin.EmailLogs el 
          WHERE el.BookingID = br.RequestID 
            AND el.TemplateKey = 'review_request'
            AND el.Status = 'sent'
      );
END
GO

PRINT 'Stored procedure [admin].[sp_GetPostEventReviewRequests] created successfully.';
GO
