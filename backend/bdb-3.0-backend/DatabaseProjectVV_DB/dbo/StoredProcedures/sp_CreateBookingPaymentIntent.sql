
-- Create payment intent for booking
CREATE   PROCEDURE sp_CreateBookingPaymentIntent
    @BookingID INT,
    @Amount DECIMAL(10, 2),
    @Currency NVARCHAR(3) = 'USD',
    @PaymentMethodID NVARCHAR(100) = NULL,
    @CustomerID NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PaymentIntentID NVARCHAR(100) = 'pi_' + LEFT(NEWID(), 8) + '_' + LEFT(NEWID(), 8);
    DECLARE @ClientSecret NVARCHAR(100) = 'secret_' + LEFT(NEWID(), 24);
    
    -- In a real implementation, this would call Stripe API to create a payment intent
    -- This is a simplified version for demo purposes
    
    -- Update booking with payment intent
    UPDATE Bookings
    SET StripePaymentIntentID = @PaymentIntentID
    WHERE BookingID = @BookingID;
    
    SELECT 
        @PaymentIntentID AS PaymentIntentID,
        @ClientSecret AS ClientSecret;
END;

GO

