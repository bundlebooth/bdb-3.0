/*
    Stored Procedure: admin.sp_GetPendingApprovalReminders
    Description: Gets bookings pending approval that need reminder emails
*/
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND OBJECT_ID = OBJECT_ID('admin.sp_GetPendingApprovalReminders'))
    DROP PROCEDURE admin.sp_GetPendingApprovalReminders
GO

CREATE PROCEDURE admin.sp_GetPendingApprovalReminders
    @DaysOld INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingID,
        b.EventDate,
        b.CreatedAt,
        s.Name AS ServiceName,
        cu.Name AS ClientName,
        vu.UserID AS VendorUserID,
        vu.Email AS VendorEmail,
        v.BusinessName AS VendorName
    FROM bookings.Bookings b
    INNER JOIN vendors.Services s ON b.ServiceID = s.ServiceID
    INNER JOIN users.Users cu ON b.UserID = cu.UserID
    INNER JOIN vendors.VendorProfiles v ON b.VendorProfileID = v.VendorProfileID
    INNER JOIN users.Users vu ON v.UserID = vu.UserID
    WHERE b.Status = 'pending'
        AND DATEDIFF(DAY, b.CreatedAt, GETDATE()) >= @DaysOld
        AND NOT EXISTS (
            SELECT 1 FROM admin.EmailLogs el 
            WHERE el.BookingID = b.BookingID 
                AND el.TemplateKey = 'booking_action_reminder'
                AND CAST(el.SentAt AS DATE) = CAST(GETDATE() AS DATE)
                AND el.Status = 'sent'
        );
END
GO
