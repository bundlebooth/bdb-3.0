-- =============================================
-- Stored Procedure: sp_Payment_MarkBookingPaid
-- Description: Marks booking as paid/confirmed
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_MarkBookingPaid]'))
    DROP PROCEDURE [dbo].[sp_Payment_MarkBookingPaid];
GO

CREATE PROCEDURE [dbo].[sp_Payment_MarkBookingPaid]
    @BookingID INT,
    @Status NVARCHAR(20) = 'confirmed',
    @StripePaymentIntentID NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Bookings
    SET 
        Status = @Status,
        FullAmountPaid = 1,
        StripePaymentIntentID = ISNULL(@StripePaymentIntentID, StripePaymentIntentID),
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
