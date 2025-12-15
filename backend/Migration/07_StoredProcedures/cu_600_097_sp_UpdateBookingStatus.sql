/*
    Migration Script: Create Stored Procedure [sp_UpdateBookingStatus]
    Phase: 600 - Stored Procedures
    Script: cu_600_097_dbo.sp_UpdateBookingStatus.sql
    Description: Creates the [dbo].[sp_UpdateBookingStatus] stored procedure
    
    Execution Order: 97
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpdateBookingStatus]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateBookingStatus]'))
    DROP PROCEDURE [dbo].[sp_UpdateBookingStatus];
GO

CREATE   PROCEDURE [dbo].[sp_UpdateBookingStatus]
    @BookingID INT,
    @Status NVARCHAR(20),
    @UserID INT,
    @Notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Update booking
        UPDATE Bookings
        SET 
            Status = @Status,
            UpdatedAt = GETDATE()
        WHERE BookingID = @BookingID;
        
        -- Add timeline entry
        INSERT INTO BookingTimeline (
            BookingID,
            Status,
            ChangedBy,
            Notes
        )
        VALUES (
            @BookingID,
            @Status,
            @UserID,
            @Notes
        );
        
        -- Get booking details for notification
        DECLARE @EventDate DATETIME;
        DECLARE @ClientID INT;
        DECLARE @VendorProfileID INT;
        DECLARE @ServiceName NVARCHAR(100);
        
        SELECT 
            @EventDate = b.EventDate,
            @ClientID = b.UserID,
            @VendorProfileID = b.VendorProfileID,
            @ServiceName = s.Name
        FROM Bookings b
        JOIN Services s ON b.ServiceID = s.ServiceID
        WHERE b.BookingID = @BookingID;
        
        -- Create appropriate notification
        IF @Status = 'confirmed'
        BEGIN
            -- Notify client
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
                @ClientID,
                'booking',
                'Booking Confirmed',
                'Your booking for ' + @ServiceName + ' on ' + CONVERT(NVARCHAR(20), @EventDate, 107) + ' has been confirmed',
                @BookingID,
                'booking',
                '/bookings/' + CAST(@BookingID AS NVARCHAR(10))
            );
            
            -- If deposit required, notify to pay
            IF EXISTS (
                SELECT 1 FROM Bookings b
                JOIN Services s ON b.ServiceID = s.ServiceID
                WHERE b.BookingID = @BookingID
                AND s.RequiresDeposit = 1
                AND b.DepositPaid = 0
            )
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
                    @ClientID,
                    'payment',
                    'Deposit Required',
                    'Please pay the deposit for your booking to secure your date',
                    @BookingID,
                    'booking',
                    '/bookings/' + CAST(@BookingID AS NVARCHAR(10)) + '/payment'
                );
            END
        END
        ELSE IF @Status = 'cancelled'
        BEGIN
            -- Notify client
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
                @ClientID,
                'booking',
                'Booking Cancelled',
                'Your booking for ' + @ServiceName + ' on ' + CONVERT(NVARCHAR(20), @EventDate, 107) + ' has been cancelled',
                @BookingID,
                'booking',
                '/bookings/' + CAST(@BookingID AS NVARCHAR(10))
            );
        END
        ELSE IF @Status = 'completed'
        BEGIN
            -- Notify client to leave review
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
                @ClientID,
                'review',
                'Leave a Review',
                'How was your experience with ' + (SELECT BusinessName FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID) + '?',
                @BookingID,
                'booking',
                '/bookings/' + CAST(@BookingID AS NVARCHAR(10)) + '/review'
            );
        END
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO

PRINT 'Stored procedure [dbo].[sp_UpdateBookingStatus] created successfully.';
GO
