-- =============================================
-- Stored Procedure: payments.sp_MarkBookingFailed
-- Description: Marks booking as payment failed
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_MarkBookingFailed]'))
    DROP PROCEDURE [payments].[sp_MarkBookingFailed];
GO

CREATE PROCEDURE [payments].[sp_MarkBookingFailed]
    @BookingID INT,
    @Status NVARCHAR(20) = 'payment_failed'
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.Bookings 
    SET Status = @Status, UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

