/*
    Migration Script: Create Stored Procedure [invoices].[sp_GetVendorInvoices]
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetVendorInvoices]'))
    DROP PROCEDURE [invoices].[sp_GetVendorInvoices];
GO


CREATE PROCEDURE [invoices].[sp_GetVendorInvoices]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Try view first, fall back to direct query
    IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[invoices].[vw_InvoicesList]'))
    BEGIN
        SELECT * FROM [invoices].[vw_InvoicesList]
        WHERE VendorProfileID = @VendorProfileID
        ORDER BY IssueDate DESC;
    END
    ELSE
    BEGIN
        SELECT i.*,
               b.EventDate,
               b.EndDate,
               b.EventLocation,
               b.EventName,
               b.EventType,
               b.TimeZone,
               b.Status AS Status, 
               b.FullAmountPaid, 
               vp.BusinessName AS VendorName, 
               CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS ClientName, 
               u.Email AS ClientEmail
        FROM [invoices].[Invoices] i
        INNER JOIN [bookings].[Bookings] b ON i.BookingID = b.BookingID
        LEFT JOIN [vendors].[VendorProfiles] vp ON b.VendorProfileID = vp.VendorProfileID
        LEFT JOIN [users].[Users] u ON b.UserID = u.UserID
        WHERE i.VendorProfileID = @VendorProfileID
        ORDER BY i.IssueDate DESC;
    END
END
GO
