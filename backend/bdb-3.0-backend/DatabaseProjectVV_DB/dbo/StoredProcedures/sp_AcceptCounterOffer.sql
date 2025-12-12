
-- Accept a counter offer from vendor
CREATE   PROCEDURE sp_AcceptCounterOffer
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
        FROM BookingRequests 
        WHERE RequestID = @RequestID AND UserID = @UserID;
        
        IF @CurrentStatus != 'counter_offer'
        BEGIN
            SELECT 
                'error' AS Status,
                'Invalid request status for acceptance' AS Message;
            RETURN;
        END
        
        -- Update request to approved
        UPDATE BookingRequests 
        SET 
            Status = 'approved',
            CounterOfferAcceptedAt = GETDATE()
        WHERE RequestID = @RequestID;
        
        -- Create notification for vendor
        INSERT INTO Notifications (UserID, Title, Message, Type, RelatedID, RelatedType)
        SELECT 
            u.UserID,
            'Counter Offer Accepted',
            (SELECT Name FROM Users WHERE UserID = @UserID) + ' has accepted your counter offer.',
            'counter_offer_accepted',
            @RequestID,
            'request'
        FROM Users u
        JOIN VendorProfiles vp ON u.UserID = vp.UserID
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

