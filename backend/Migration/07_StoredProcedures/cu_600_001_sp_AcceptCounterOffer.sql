/*
    Migration Script: Create Stored Procedure [sp_AcceptCounterOffer]
    Phase: 600 - Stored Procedures
    Script: cu_600_001_dbo.sp_AcceptCounterOffer.sql
    Description: Creates the [bookings].[sp_AcceptCounterOffer] stored procedure
    
    Execution Order: 1
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_AcceptCounterOffer]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_AcceptCounterOffer]'))
    DROP PROCEDURE [bookings].[sp_AcceptCounterOffer];
GO

CREATE   PROCEDURE [bookings].[sp_AcceptCounterOffer]
    @RequestID INT,
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verify user owns this request and it's a counter offer
        DECLARE @CurrentStatus NVARCHAR(50);
        DECLARE @VendorProfileID INT;
        
        SELECT 
            @CurrentStatus = Status,
            @VendorProfileID = VendorProfileID
        FROM bookings.BookingRequests 
        WHERE RequestID = @RequestID AND UserID = @UserID;
        
        IF @CurrentStatus != 'counter_offer'
        BEGIN
            SELECT 
                'error' AS Status,
                'Invalid request status for acceptance' AS Message;
            RETURN;
        END
        
        -- Update request to approved
        UPDATE bookings.BookingRequests 
        SET 
            Status = 'approved',
            CounterOfferAcceptedAt = GETDATE()
        WHERE RequestID = @RequestID;
        
        -- Create notification for vendor
        INSERT INTO notifications.Notifications (UserID, Title, Message, Type, RelatedID, RelatedType)
        SELECT 
            u.UserID,
            'Counter Offer Accepted',
            (SELECT Name FROM users.Users WHERE UserID = @UserID) + ' has accepted your counter offer.',
            'counter_offer_accepted',
            @RequestID,
            'request'
        FROM users.Users u
        JOIN vendors.VendorProfiles vp ON u.UserID = vp.UserID
        WHERE vp.VendorProfileID = @VendorProfileID;
        
        SELECT 
            'success' AS Status,
            'Counter offer accepted successfully' AS Message,
            @RequestID AS RequestID;
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        SELECT 
            'error' AS Status,
            'Error accepting counter offer: ' + @ErrorMessage AS Message;
    END CATCH
END;

GO

PRINT 'Stored procedure [bookings].[sp_AcceptCounterOffer] created successfully.';
GO




