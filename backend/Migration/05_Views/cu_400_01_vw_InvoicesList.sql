/*
    Migration Script: Create View [vw_InvoicesList]
    Phase: 400 - Views
    Script: cu_400_01_dbo.vw_InvoicesList.sql
    Description: Creates the [invoices].[vw_InvoicesList] view
    
    Execution Order: 1
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [invoices].[vw_InvoicesList]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[invoices].[vw_InvoicesList]'))
    DROP VIEW [invoices].[vw_InvoicesList];
GO

CREATE VIEW [invoices].[vw_InvoicesList] AS
SELECT 
    i.InvoiceID,
    i.InvoiceNumber,
    i.IssueDate,
    i.DueDate,
    i.Status AS InvoiceStatus,
    i.Currency,
    i.Subtotal,
    i.VendorExpensesTotal,
    i.PlatformFee,
    i.StripeFee,
    i.TaxAmount,
    i.TotalAmount, -- invoice total
    i.BookingID,
    b.UserID,
    i.VendorProfileID,
    b.Status AS Status, -- booking status (kept as Status for UI compatibility)
    b.FullAmountPaid,
    COALESCE(
        CASE WHEN svc.ServiceStartTime IS NOT NULL AND br.EventDate IS NOT NULL
             THEN CAST(CONVERT(VARCHAR(10), br.EventDate, 120) + ' ' + CONVERT(VARCHAR(8), svc.ServiceStartTime, 108) AS DATETIME) END,
        b.EventDate,
        CASE WHEN br.EventDate IS NOT NULL THEN CAST(CONVERT(VARCHAR(10), br.EventDate, 120) + ' ' + ISNULL(CONVERT(VARCHAR(8), br.EventTime, 108), '00:00:00') AS DATETIME) ELSE NULL END
    ) AS EventDate,
    COALESCE(
        CASE WHEN svc.ServiceEndTime IS NOT NULL AND br.EventDate IS NOT NULL
             THEN CAST(CONVERT(VARCHAR(10), br.EventDate, 120) + ' ' + CONVERT(VARCHAR(8), svc.ServiceEndTime, 108) AS DATETIME) END,
        b.EndDate,
        CASE WHEN br.EventDate IS NOT NULL THEN CAST(CONVERT(VARCHAR(10), br.EventDate, 120) + ' ' + ISNULL(CONVERT(VARCHAR(8), br.EventEndTime, 108), ISNULL(CONVERT(VARCHAR(8), br.EventTime, 108), '00:00:00')) AS DATETIME) ELSE NULL END
    ) AS EndDate,
    COALESCE(b.EventLocation, br.EventLocation) AS EventLocation,
    COALESCE(b.EventName, br.EventName) AS EventName,
    COALESCE(b.EventType, br.EventType) AS EventType,
    COALESCE(b.TimeZone, br.TimeZone) AS TimeZone,
    b.AttendeeCount,
    vp.BusinessName AS VendorName,
    CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS ClientName,
    u.Email AS ClientEmail,
    COALESCE(
        svc.ServiceNames,
        (
            SELECT STRING_AGG(x.ServiceName, ', ')
            FROM (
                SELECT DISTINCT s2.Name AS ServiceName
                FROM bookings.BookingServices bs
                JOIN vendors.Services s2 ON s2.ServiceID = bs.ServiceID
                WHERE bs.BookingID = b.BookingID
            ) x
        ),
        (SELECT s3.Name FROM vendors.Services s3 WHERE s3.ServiceID = b.ServiceID)
    ) AS ServicesSummary
FROM invoices.Invoices i
JOIN bookings.Bookings b ON i.BookingID = b.BookingID
LEFT JOIN bookings.BookingRequests br
  ON br.PaymentIntentID = b.StripePaymentIntentID
 AND br.UserID = b.UserID
 AND br.VendorProfileID = b.VendorProfileID
OUTER APPLY (
    SELECT 
        MIN(TRY_CONVERT(time, COALESCE(
            JSON_VALUE(js.value, '$.startTime'),
            JSON_VALUE(js.value, '$.timeStart'),
            JSON_VALUE(js.value, '$.start'),
            JSON_VALUE(js.value, '$.StartTime'),
            JSON_VALUE(js.value, '$.eventStart'),
            JSON_VALUE(js.value, '$.start_time')
        ))) AS ServiceStartTime,
        MAX(TRY_CONVERT(time, COALESCE(
            JSON_VALUE(js.value, '$.endTime'),
            JSON_VALUE(js.value, '$.timeEnd'),
            JSON_VALUE(js.value, '$.end'),
            JSON_VALUE(js.value, '$.EndTime'),
            JSON_VALUE(js.value, '$.eventEnd'),
            JSON_VALUE(js.value, '$.end_time')
        ))) AS ServiceEndTime,
        STRING_AGG(
            COALESCE(
                JSON_VALUE(js.value, '$.serviceName'),
                JSON_VALUE(js.value, '$.name'),
                JSON_VALUE(js.value, '$.Name'),
                JSON_VALUE(js.value, '$.service.name'),
                JSON_VALUE(js.value, '$.title')
            ), ', '
        ) AS ServiceNames
    FROM OPENJSON(br.Services) js
) svc
LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
LEFT JOIN users.Users u ON b.UserID = u.UserID;
GO

PRINT 'View [invoices].[vw_InvoicesList] created successfully.';
GO
