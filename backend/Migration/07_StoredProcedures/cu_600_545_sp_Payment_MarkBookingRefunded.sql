-- =============================================
-- Stored Procedure: sp_Payment_MarkBookingRefunded
-- Description: Marks booking as refunded
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_MarkBookingRefunded]'))
    DROP PROCEDURE [dbo].[sp_Payment_MarkBookingRefunded];
GO

CREATE PROCEDURE [dbo].[sp_Payment_MarkBookingRefunded]
    @BookingID INT,
    @RefundAmount DECIMAL(10,2),
    @Status NVARCHAR(20) = 'refunded'
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Bookings 
    SET RefundAmount = @RefundAmount, Status = @Status, UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
