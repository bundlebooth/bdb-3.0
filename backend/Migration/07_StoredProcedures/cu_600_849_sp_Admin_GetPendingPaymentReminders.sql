/*
    Stored Procedure: admin.sp_GetPendingPaymentReminders
    Description: Gets bookings pending payment that need reminder emails
*/
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND OBJECT_ID = OBJECT_ID('admin.sp_GetPendingPaymentReminders'))
    DROP PROCEDURE admin.sp_GetPendingPaymentReminders
GO

CREATE PROCEDURE admin.sp_GetPendingPaymentReminders
    @DaysOld INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingID,
        b.EventDate,
        b.UpdatedAt,
        s.Name AS ServiceName,
        cu.UserID AS ClientUserID,
        cu.Email AS ClientEmail,
        cu.Name AS ClientName,
        v.BusinessName AS VendorName
    FROM bookings.Bookings b
    INNER JOIN vendors.Services s ON b.ServiceID = s.ServiceID
    INNER JOIN users.Users cu ON b.UserID = cu.UserID
    INNER JOIN vendors.VendorProfiles v ON b.VendorProfileID = v.VendorProfileID
    WHERE b.Status = 'accepted'
        AND b.DepositPaid = 0
        AND DATEDIFF(DAY, b.UpdatedAt, GETDATE()) >= @DaysOld
        AND NOT EXISTS (
            SELECT 1 FROM admin.EmailLogs el 
            WHERE el.BookingID = b.BookingID 
                AND el.TemplateKey = 'booking_action_reminder'
                AND CAST(el.SentAt AS DATE) = CAST(GETDATE() AS DATE)
                AND el.Status = 'sent'
        );
END
GO
