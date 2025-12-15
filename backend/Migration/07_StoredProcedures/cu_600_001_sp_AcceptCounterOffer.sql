/*
    Migration Script: Create Stored Procedure [sp_AcceptCounterOffer]
    Phase: 600 - Stored Procedures
    Script: cu_600_001_dbo.sp_AcceptCounterOffer.sql
    Description: Creates the [dbo].[sp_AcceptCounterOffer] stored procedure
    
    Execution Order: 1
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_AcceptCounterOffer]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_AcceptCounterOffer]'))
    DROP PROCEDURE [dbo].[sp_AcceptCounterOffer];
GO

CREATE   PROCEDURE [dbo].[sp_AcceptCounterOffer]
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

PRINT 'Stored procedure [dbo].[sp_AcceptCounterOffer] created successfully.';
GO
