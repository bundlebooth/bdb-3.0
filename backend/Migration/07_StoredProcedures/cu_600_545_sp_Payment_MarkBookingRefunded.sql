-- =============================================
-- Stored Procedure: payments.sp_MarkBookingRefunded
-- Description: Marks booking as refunded
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_MarkBookingRefunded]'))
    DROP PROCEDURE [payments].[sp_MarkBookingRefunded];
GO

CREATE PROCEDURE [payments].[sp_MarkBookingRefunded]
    @BookingID INT,
    @RefundAmount DECIMAL(10,2),
    @Status NVARCHAR(20) = 'refunded'
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.Bookings 
    SET RefundAmount = @RefundAmount, Status = @Status, UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

