/*
    Migration Script: Create Stored Procedure [sp_CreateBookingPaymentIntent]
    Phase: 600 - Stored Procedures
    Script: cu_600_015_dbo.sp_CreateBookingPaymentIntent.sql
    Description: Creates the [payments].[sp_CreateBookingPaymentIntent] stored procedure
    
    Execution Order: 15
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [payments].[sp_CreateBookingPaymentIntent]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_CreateBookingPaymentIntent]'))
    DROP PROCEDURE [payments].[sp_CreateBookingPaymentIntent];
GO

CREATE   PROCEDURE [payments].[sp_CreateBookingPaymentIntent]
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
    UPDATE bookings.Bookings
    SET StripePaymentIntentID = @PaymentIntentID
    WHERE BookingID = @BookingID;
    
    SELECT 
        @PaymentIntentID AS PaymentIntentID,
        @ClientSecret AS ClientSecret;
END;

GO

PRINT 'Stored procedure [payments].[sp_CreateBookingPaymentIntent] created successfully.';
GO

