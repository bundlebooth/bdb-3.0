-- =============================================
-- Stored Procedure: sp_Payment_MarkBookingFailed
-- Description: Marks booking as payment failed
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_MarkBookingFailed]'))
    DROP PROCEDURE [dbo].[sp_Payment_MarkBookingFailed];
GO

CREATE PROCEDURE [dbo].[sp_Payment_MarkBookingFailed]
    @BookingID INT,
    @Status NVARCHAR(20) = 'payment_failed'
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Bookings 
    SET Status = @Status, UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
