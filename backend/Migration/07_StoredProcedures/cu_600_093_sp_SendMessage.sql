/*
    Migration Script: Create Stored Procedure [sp_SendMessage]
    Phase: 600 - Stored Procedures
    Script: cu_600_093_dbo.sp_SendMessage.sql
    Description: Creates the [dbo].[sp_SendMessage] stored procedure
    
    Execution Order: 93
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_SendMessage]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_SendMessage]'))
    DROP PROCEDURE [dbo].[sp_SendMessage];
GO

CREATE   PROCEDURE [dbo].[sp_SendMessage]
    @ConversationID INT,
    @SenderID INT,
    @Content NVARCHAR(MAX),
    @AttachmentURL NVARCHAR(255) = NULL,
    @AttachmentType NVARCHAR(50) = NULL,
    @AttachmentSize INT = NULL,
    @AttachmentName NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate conversation exists and user has access
    IF NOT EXISTS (
        SELECT 1 FROM Conversations c
        LEFT JOIN VendorProfiles v ON c.VendorProfileID = v.VendorProfileID
        WHERE c.ConversationID = @ConversationID
        AND (c.UserID = @SenderID OR v.UserID = @SenderID)
    )
    BEGIN
        RAISERROR('Conversation does not exist or user does not have access', 16, 1);
        RETURN;
    END
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Add message
        INSERT INTO Messages (
            ConversationID,
            SenderID,
            Content
        )
        VALUES (
            @ConversationID,
            @SenderID,
            @Content
        );
        
        DECLARE @MessageID INT = SCOPE_IDENTITY();
        
        -- Add attachment if provided
        IF @AttachmentURL IS NOT NULL
        BEGIN
            INSERT INTO MessageAttachments (
                MessageID,
                FileURL,
                FileType,
                FileSize,
                OriginalName
            )
            VALUES (
                @MessageID,
                @AttachmentURL,
                @AttachmentType,
                @AttachmentSize,
                @AttachmentName
            );
        END
        
        -- Update conversation last message
        UPDATE Conversations
        SET 
            LastMessageAt = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE ConversationID = @ConversationID;
        
        -- Get recipient ID and vendor info
        DECLARE @RecipientID INT;
        DECLARE @IsVendor BIT;
        DECLARE @VendorProfileID INT;
        DECLARE @VendorName NVARCHAR(100);
        DECLARE @UserName NVARCHAR(100);
        
        SELECT 
            @RecipientID = CASE WHEN c.UserID = @SenderID THEN v.UserID ELSE c.UserID END,
            @IsVendor = CASE WHEN c.UserID = @SenderID THEN 1 ELSE 0 END,
            @VendorProfileID = c.VendorProfileID,
            @VendorName = v.BusinessName,
            @UserName = u.Name
        FROM Conversations c
        JOIN VendorProfiles v ON c.VendorProfileID = v.VendorProfileID
        JOIN Users u ON c.UserID = u.UserID
        WHERE c.ConversationID = @ConversationID;
        
        -- Create notification
        IF @RecipientID IS NOT NULL
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
                @RecipientID,
                'message',
                'New Message',
                'You have a new message from ' + @UserName,
                @MessageID,
                'message',
                CASE 
                    WHEN @IsVendor = 1 THEN '/vendor/messages/' + CAST(@ConversationID AS NVARCHAR(10))
                    ELSE '/messages/' + CAST(@ConversationID AS NVARCHAR(10))
                END
            );
        END
        
        COMMIT TRANSACTION;
        
        -- Return success with message details
        SELECT 
            @MessageID AS MessageID,
            @ConversationID AS ConversationID,
            @SenderID AS SenderID,
            GETDATE() AS SentAt;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;

GO

PRINT 'Stored procedure [dbo].[sp_SendMessage] created successfully.';
GO
