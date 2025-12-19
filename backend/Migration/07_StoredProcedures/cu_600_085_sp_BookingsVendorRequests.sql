/*
    Migration Script: Create Stored Procedure for Vendor Booking Requests
    Phase: 600 - Stored Procedures
    Script: cu_600_085_sp_BookingsVendorRequests.sql
    Description: Creates stored procedure for getting vendor booking requests with filtering
    Schema: bookings
    Execution Order: 85
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_GetVendorRequests]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetVendorRequests]'))
    DROP PROCEDURE [bookings].[sp_GetVendorRequests];
GO

CREATE PROCEDURE [bookings].[sp_GetVendorRequests]
    @VendorProfileID INT = NULL,
    @VendorUserID INT = NULL,
    @Status NVARCHAR(50) = NULL,
    @Direction NVARCHAR(20) = 'inbound'
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        br.RequestID,
        br.UserID,
        u.Name AS ClientName,
        u.Email AS ClientEmail,
        vp.BusinessName AS VendorName,
        br.Services,
        br.EventDate,
        CONVERT(VARCHAR(8), br.EventTime, 108) AS EventTime,
        CONVERT(VARCHAR(8), br.EventEndTime, 108) AS EventEndTime,
        br.EventLocation,
        br.AttendeeCount,
        br.Budget,
        br.SpecialRequests,
        br.EventName,
        br.EventType,
        br.TimeZone,
        br.Status,
        br.CreatedAt,
        br.ExpiresAt,
        CASE WHEN br.ExpiresAt <= GETDATE() AND br.Status = 'pending' THEN 1 ELSE 0 END AS IsExpired
    FROM BookingRequests br
    LEFT JOIN users.Users u ON br.UserID = u.UserID
    LEFT JOIN vendors.VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
    WHERE (
        (@Direction = 'outbound' AND br.UserID = @VendorUserID)
        OR (@Direction != 'outbound' AND br.VendorProfileID = @VendorProfileID)
      )
      AND (
        @Status IS NULL 
        OR @Status = 'all'
        OR (@Status = 'expired' AND (br.Status = 'expired' OR (br.Status = 'pending' AND br.ExpiresAt <= GETDATE())))
        OR br.Status = @Status
      )
    ORDER BY 
        CASE WHEN @Status IS NULL OR @Status = 'all' THEN 0 ELSE 1 END,
        CASE WHEN @Status IS NOT NULL AND @Status != 'all' AND br.Status = 'pending' THEN 1 ELSE 2 END,
        br.CreatedAt DESC;
END
GO

PRINT 'Stored procedure [bookings].[sp_GetVendorRequests] created successfully.';
GO
