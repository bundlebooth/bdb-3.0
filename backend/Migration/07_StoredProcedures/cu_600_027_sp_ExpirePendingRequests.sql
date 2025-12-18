/*
    Migration Script: Create Stored Procedure [sp_ExpirePendingRequests]
    Phase: 600 - Stored Procedures
    Script: cu_600_027_dbo.sp_ExpirePendingRequests.sql
    Description: Creates the [bookings].[sp_ExpirePendingRequests] stored procedure
    
    Execution Order: 27
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_ExpirePendingRequests]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_ExpirePendingRequests]'))
    DROP PROCEDURE [bookings].[sp_ExpirePendingRequests];
GO

CREATE   PROCEDURE [bookings].[sp_ExpirePendingRequests]
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Update expired requests
        UPDATE bookings.BookingRequests 
        SET 
            Status = 'expired',
            ExpiredAt = GETDATE()
        WHERE Status = 'pending' 
            AND ExpiresAt < GETDATE();
        
        DECLARE @ExpiredCount INT = @@ROWCOUNT;
        
        -- Create notifications for users with expired requests
        INSERT INTO notifications.Notifications (UserID, Title, Message, Type, RelatedID, RelatedType)
        SELECT 
            br.UserID,
            'Booking Request Expired',
            'Your booking request to ' + vp.BusinessName + ' has expired.',
            'request_expired',
            br.RequestID,
            'request'
        FROM bookings.BookingRequests br
        JOIN vendors.VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
        WHERE br.Status = 'expired' 
            AND br.ExpiredAt >= DATEADD(MINUTE, -5, GETDATE()); -- Only recent expirations
        
        SELECT 
            'success' AS Status,
            CAST(@ExpiredCount AS NVARCHAR(10)) + ' requests expired' AS Message,
            @ExpiredCount AS ExpiredCount;
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        SELECT 
            'error' AS Status,
            'Error expiring requests: ' + @ErrorMessage AS Message;
    END CATCH
END;

GO

PRINT 'Stored procedure [bookings].[sp_ExpirePendingRequests] created successfully.';
GO



