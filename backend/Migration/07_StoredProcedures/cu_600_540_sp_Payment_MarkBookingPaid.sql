-- =============================================
-- Stored Procedure: payments.sp_MarkBookingPaid
-- Description: Marks booking as paid/confirmed
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_MarkBookingPaid]'))
    DROP PROCEDURE [payments].[sp_MarkBookingPaid];
GO

CREATE PROCEDURE [payments].[sp_MarkBookingPaid]
    @BookingID INT,
    @Status NVARCHAR(20) = 'confirmed',
    @StripePaymentIntentID NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.Bookings
    SET 
        Status = @Status,
        FullAmountPaid = 1,
        StripePaymentIntentID = ISNULL(@StripePaymentIntentID, StripePaymentIntentID),
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

