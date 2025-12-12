
-- Confirm booking payment
CREATE   PROCEDURE sp_ConfirmBookingPayment
    @BookingID INT,
    @PaymentIntentID NVARCHAR(100),
    @Amount DECIMAL(10, 2),
    @FeeAmount DECIMAL(10, 2) = 0,
    @ChargeID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Update booking payment status
        DECLARE @IsDeposit BIT = CASE 
            WHEN @Amount < (SELECT TotalAmount FROM Bookings WHERE BookingID = @BookingID) 
            THEN 1 ELSE 0 END;
        
        IF @IsDeposit = 1
        BEGIN
            UPDATE Bookings
            SET DepositPaid = 1
            WHERE BookingID = @BookingID;
        END
        ELSE
        BEGIN
            UPDATE Bookings
            SET FullAmountPaid = 1
            WHERE BookingID = @BookingID;
        END
        
        -- Record transaction
        DECLARE @UserID INT = (SELECT UserID FROM Bookings WHERE BookingID = @BookingID);
        DECLARE @VendorProfileID INT = (SELECT VendorProfileID FROM Bookings WHERE BookingID = @BookingID);
        
        INSERT INTO Transactions (
            UserID,
            VendorProfileID,
            BookingID,
            Amount,
            FeeAmount,
            NetAmount,
            Currency,
            Description,
            StripeChargeID,
            Status
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @BookingID,
            @Amount,
            @FeeAmount,
            @Amount - @FeeAmount,
            'USD',
            CASE WHEN @IsDeposit = 1 THEN 'Deposit payment' ELSE 'Full payment' END,
            @ChargeID,
            'succeeded'
        );
        
        -- Create notification
        IF @IsDeposit = 1
        BEGIN
            INSERT INTO Notifications (
                UserID,
                Type,
                Title,
                Message,
                RelatedID,
                RelatedType,
                ActionURL
            )
            VALUES (
                (SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID),
                'payment',
                'Deposit Received',
                'A deposit payment has been received for booking #' + CAST(@BookingID AS NVARCHAR(10)),
                @BookingID,
                'booking',
                '/vendor/bookings/' + CAST(@BookingID AS NVARCHAR(10))
            );
        END
        ELSE
        BEGIN
            INSERT INTO Notifications (
                UserID,
                Type,
                Title,
                Message,
                RelatedID,
                RelatedType,
                ActionURL
            )
            VALUES (
                (SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID),
                'payment',
                'Payment Received',
                'Full payment has been received for booking #' + CAST(@BookingID AS NVARCHAR(10)),
                @BookingID,
                'booking',
                '/vendor/bookings/' + CAST(@BookingID AS NVARCHAR(10))
            );
        END
        
        COMMIT TRANSACTION;
        
        SELECT 1 AS Success;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO

