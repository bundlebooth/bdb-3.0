-- =============================================
-- Stored Procedure: admin.sp_CancelBooking
-- Description: Cancels a booking
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_CancelBooking]'))
    DROP PROCEDURE [admin].[sp_CancelBooking];
GO

CREATE PROCEDURE [admin].[sp_CancelBooking]
    @BookingID INT,
    @Reason NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.Bookings 
    SET Status = 'Cancelled', 
        SpecialRequests = CASE WHEN @Reason IS NOT NULL THEN COALESCE(SpecialRequests + ' | Cancellation Reason: ', 'Cancellation Reason: ') + @Reason ELSE SpecialRequests END,
        CancellationDate = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

