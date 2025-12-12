
-- Add review procedure
CREATE   PROCEDURE sp_AddReview
    @UserID INT,
    @VendorProfileID INT,
    @BookingID INT,
    @Rating INT,
    @Title NVARCHAR(100),
    @Comment NVARCHAR(MAX),
    @IsAnonymous BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Add review
        INSERT INTO Reviews (
            UserID,
            VendorProfileID,
            BookingID,
            Rating,
            Title,
            Comment,
            IsAnonymous,
            IsApproved
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @BookingID,
            @Rating,
            @Title,
            @Comment,
            @IsAnonymous,
            1 -- Auto-approve for demo
        );
        
        DECLARE @ReviewID INT = SCOPE_IDENTITY();
        
        -- Update vendor rating
        UPDATE VendorProfiles
        SET 
            AverageResponseTime = ISNULL((
                SELECT AVG(DATEDIFF(MINUTE, m.CreatedAt, m2.CreatedAt))
                FROM Messages m
                JOIN Messages m2 ON m.ConversationID = m2.ConversationID AND m2.MessageID > m.MessageID
                JOIN Conversations c ON m.ConversationID = c.ConversationID
                WHERE c.VendorProfileID = @VendorProfileID
                AND m.SenderID != @UserID
                AND m2.SenderID = @UserID
            ), AverageResponseTime),
            ResponseRate = ISNULL((
                SELECT CAST(COUNT(DISTINCT CASE WHEN r.Response IS NOT NULL THEN r.ReviewID END) AS FLOAT) / 
                       NULLIF(COUNT(DISTINCT r.ReviewID), 0)
                FROM Reviews r
                WHERE r.VendorProfileID = @VendorProfileID
            ), ResponseRate)
        WHERE VendorProfileID = @VendorProfileID;
        
        -- Create notification for vendor
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
            'review',
            'New Review',
            'You have received a new ' + CAST(@Rating AS NVARCHAR(10)) + ' star review',
            @ReviewID,
            'review',
            '/vendor/reviews'
        );
        
        COMMIT TRANSACTION;
        
        SELECT @ReviewID AS ReviewID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO

