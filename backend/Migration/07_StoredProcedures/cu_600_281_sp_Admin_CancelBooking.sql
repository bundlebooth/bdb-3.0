-- =============================================
-- Stored Procedure: sp_Admin_CancelBooking
-- Description: Cancels a booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_CancelBooking]'))
    DROP PROCEDURE [dbo].[sp_Admin_CancelBooking];
GO

CREATE PROCEDURE [dbo].[sp_Admin_CancelBooking]
    @BookingID INT,
    @Reason NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Bookings 
    SET Status = 'Cancelled', 
        SpecialRequests = CASE WHEN @Reason IS NOT NULL THEN COALESCE(SpecialRequests + ' | Cancellation Reason: ', 'Cancellation Reason: ') + @Reason ELSE SpecialRequests END,
        CancellationDate = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
