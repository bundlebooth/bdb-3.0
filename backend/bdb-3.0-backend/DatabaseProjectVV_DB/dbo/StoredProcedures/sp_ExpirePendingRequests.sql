
-- Auto-expire old pending requests
CREATE   PROCEDURE sp_ExpirePendingRequests
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Update expired requests
        UPDATE BookingRequests 
        SET 
            Status = 'expired',
            ExpiredAt = GETDATE()
        WHERE Status = 'pending' 
            AND ExpiresAt < GETDATE();
        
        DECLARE @ExpiredCount INT = @@ROWCOUNT;
        
        -- Create notifications for users with expired requests
        INSERT INTO Notifications (UserID, Title, Message, Type, RelatedID, RelatedType)
        SELECT 
            br.UserID,
            'Booking Request Expired',
            'Your booking request to ' + vp.BusinessName + ' has expired.',
            'request_expired',
            br.RequestID,
            'request'
        FROM BookingRequests br
        JOIN VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
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

