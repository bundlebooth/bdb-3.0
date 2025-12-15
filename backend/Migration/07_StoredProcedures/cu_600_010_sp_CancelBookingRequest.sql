/*
    Migration Script: Create Stored Procedure [sp_CancelBookingRequest]
    Phase: 600 - Stored Procedures
    Script: cu_600_010_dbo.sp_CancelBookingRequest.sql
    Description: Creates the [dbo].[sp_CancelBookingRequest] stored procedure
    
    Execution Order: 10
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_CancelBookingRequest]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_CancelBookingRequest]'))
    DROP PROCEDURE [dbo].[sp_CancelBookingRequest];
GO

CREATE   PROCEDURE [dbo].[sp_CancelBookingRequest]
    @RequestID INT,
    @UserID INT,
    @CancellationReason NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verify user owns this request
        DECLARE @CurrentStatus NVARCHAR(50);
        DECLARE @VendorProfileID INT;
        
        SELECT 
            @CurrentStatus = Status,
            @VendorProfileID = VendorProfileID
        FROM BookingRequests 
        WHERE RequestID = @RequestID AND UserID = @UserID;
        
        IF @VendorProfileID IS NULL
        BEGIN
            SELECT 
                'error' AS Status,
                'Request not found or access denied' AS Message;
            RETURN;
        END
        
        IF @CurrentStatus IN ('cancelled', 'confirmed')
        BEGIN
            SELECT 
                'error' AS Status,
                'Request cannot be cancelled in current status' AS Message;
            RETURN;
        END
        
        -- Update request
        UPDATE BookingRequests 
        SET 
            Status = 'cancelled',
            CancellationReason = @CancellationReason,
            CancelledAt = GETDATE()
        WHERE RequestID = @RequestID;
        
        -- Create notification for vendor
        INSERT INTO Notifications (UserID, Title, Message, Type, RelatedID, RelatedType)
        SELECT 
            u.UserID,
            'Booking Request Cancelled',
            (SELECT Name FROM Users WHERE UserID = @UserID) + ' has cancelled their booking request.',
            'booking_cancelled',
            @RequestID,
            'request'
        FROM Users u
        JOIN VendorProfiles vp ON u.UserID = vp.UserID
        WHERE vp.VendorProfileID = @VendorProfileID;
        
        SELECT 
            'success' AS Status,
            'Request cancelled successfully' AS Message,
            @RequestID AS RequestID;
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        SELECT 
            'error' AS Status,
            'Error cancelling request: ' + @ErrorMessage AS Message;
    END CATCH
END;

GO

PRINT 'Stored procedure [dbo].[sp_CancelBookingRequest] created successfully.';
GO
