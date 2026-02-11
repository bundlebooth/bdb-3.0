-- =============================================
-- Stored Procedure: sp_CreateGuestSupportConversation
-- Description: Creates a support conversation for guest (non-logged-in) users
-- =============================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_CreateGuestSupportConversation' AND schema_id = SCHEMA_ID('messages'))
    DROP PROCEDURE messages.sp_CreateGuestSupportConversation
GO

CREATE PROCEDURE messages.sp_CreateGuestSupportConversation
    @GuestName NVARCHAR(255),
    @GuestEmail NVARCHAR(255),
    @Category NVARCHAR(100) = 'general',
    @Subject NVARCHAR(255),
    @Description NVARCHAR(MAX) = '',
    @ReferenceNumber NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ConversationID INT;
    DECLARE @TicketNumber NVARCHAR(20);
    DECLARE @MessageID INT;
    
    -- Generate ticket number (format: PB-YYYYMMDD-XXXX)
    SET @TicketNumber = 'PB-' + FORMAT(GETDATE(), 'yyyyMMdd') + '-' + RIGHT('0000' + CAST(ABS(CHECKSUM(NEWID())) % 10000 AS VARCHAR(4)), 4);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Create the conversation with guest info
        INSERT INTO messages.Conversations (
            ConversationType,
            Subject,
            CreatedAt,
            UpdatedAt,
            GuestName,
            GuestEmail,
            ReferenceNumber,
            Category
        )
        VALUES (
            'guest_support',
            @Subject,
            GETDATE(),
            GETDATE(),
            @GuestName,
            @GuestEmail,
            @ReferenceNumber,
            @Category
        );
        
        SET @ConversationID = SCOPE_IDENTITY();
        
        -- Create welcome message from support
        DECLARE @WelcomeMessage NVARCHAR(MAX);
        SET @WelcomeMessage = N'👋 Hi ' + @GuestName + N'! Thanks for reaching out to Planbeau Support.

Your reference number is: **' + @ReferenceNumber + N'**
Please save this for future reference.

We''ll send a response to ' + @GuestEmail + N' when we reply.

**Topic:** ' + @Category + N'
**Subject:** ' + @Subject + N'

' + CASE WHEN LEN(@Description) > 0 THEN N'**Details:** ' + @Description + N'

' ELSE N'' END + N'How can we help you today?';
        
        INSERT INTO messages.Messages (
            ConversationID,
            SenderID,
            SenderType,
            Content,
            CreatedAt,
            IsRead
        )
        VALUES (
            @ConversationID,
            NULL, -- No user ID for system/support messages
            'support',
            @WelcomeMessage,
            GETDATE(),
            0
        );
        
        -- Note: Support ticket creation skipped - support.Tickets table may not exist
        -- The conversation itself serves as the support request record
        
        COMMIT TRANSACTION;
        
        -- Return the conversation ID and ticket number
        SELECT @ConversationID AS ConversationID, @TicketNumber AS TicketNumber;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END
GO
