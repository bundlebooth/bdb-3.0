/*
    Migration Script: Create Stored Procedure [sp_CreateConversation]
    Phase: 600 - Stored Procedures
    Script: cu_600_018_dbo.sp_CreateConversation.sql
    Description: Creates the [messages].[sp_CreateConversation] stored procedure
    
    Execution Order: 18
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [messages].[sp_CreateConversation]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[messages].[sp_CreateConversation]'))
    DROP PROCEDURE [messages].[sp_CreateConversation];
GO

CREATE   PROCEDURE [messages].[sp_CreateConversation]
    @UserID INT,
    @VendorProfileID INT,
    @BookingID INT = NULL,
    @Subject NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validate participants
        IF NOT EXISTS (SELECT 1 FROM users.Users WHERE UserID = @UserID AND IsActive = 1)
        BEGIN
            RAISERROR('User not found or inactive', 16, 1);
            RETURN;
        END
        
        IF NOT EXISTS (SELECT 1 FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID AND IsVerified = 1)
        BEGIN
            RAISERROR('Vendor not found or not verified', 16, 1);
            RETURN;
        END
        
        -- Validate booking if provided
        IF @BookingID IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM bookings.Bookings 
                WHERE BookingID = @BookingID 
                AND (UserID = @UserID OR VendorProfileID = @VendorProfileID)
            )
            BEGIN
                RAISERROR('Booking not found or not associated with these participants', 16, 1);
                RETURN;
            END
        END
        
        -- Set default subject if not provided
        IF @Subject IS NULL
        BEGIN
            SET @Subject = CASE 
                WHEN @BookingID IS NOT NULL THEN 'Booking #' + CAST(@BookingID AS NVARCHAR(10))
                ELSE 'New Conversation'
            END;
        END
        
        -- Create conversation
        INSERT INTO messages.Conversations (
            UserID,
            VendorProfileID,
            BookingID,
            Subject,
            LastMessageAt
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @BookingID,
            @Subject,
            GETDATE()
        );
        
        DECLARE @ConversationID INT = SCOPE_IDENTITY();
        
        -- Return conversation details
        SELECT 
            c.ConversationID,
            c.UserID,
            CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS UserName,
            u.ProfileImageURL AS UserAvatar,
            c.VendorProfileID,
            v.BusinessName AS VendorName,
            (SELECT TOP 1 vi.ImageURL FROM vendors.VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1) AS VendorImage,
            c.BookingID,
            b.ServiceID,
            s.Name AS ServiceName,
            c.Subject,
            c.LastMessageAt,
            c.CreatedAt
        FROM messages.Conversations c
        JOIN users.Users u ON c.UserID = u.UserID
        JOIN vendors.VendorProfiles v ON c.VendorProfileID = v.VendorProfileID
        LEFT JOIN bookings.Bookings b ON c.BookingID = b.BookingID
        LEFT JOIN vendors.Services s ON b.ServiceID = s.ServiceID
        WHERE c.ConversationID = @ConversationID;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO

PRINT 'Stored procedure [messages].[sp_CreateConversation] created successfully.';
GO






