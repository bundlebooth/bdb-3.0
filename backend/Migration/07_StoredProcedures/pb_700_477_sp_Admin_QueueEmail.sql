/*
    Stored Procedure: admin.sp_QueueEmail
    Description: Adds an email to the queue for scheduled sending
*/
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND OBJECT_ID = OBJECT_ID('admin.sp_QueueEmail'))
    DROP PROCEDURE admin.sp_QueueEmail
GO

CREATE PROCEDURE admin.sp_QueueEmail
    @TemplateKey NVARCHAR(50),
    @RecipientEmail NVARCHAR(255),
    @RecipientName NVARCHAR(255) = NULL,
    @Variables NVARCHAR(MAX) = NULL,
    @ScheduledAt DATETIME2,
    @Priority INT = 5,
    @UserID INT = NULL,
    @BookingID INT = NULL,
    @EmailCategory NVARCHAR(50) = NULL,
    @Metadata NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO admin.EmailQueue (
        TemplateKey, RecipientEmail, RecipientName, Variables, 
        ScheduledAt, Priority, UserID, BookingID, EmailCategory, Metadata
    )
    VALUES (
        @TemplateKey, @RecipientEmail, @RecipientName, @Variables,
        @ScheduledAt, @Priority, @UserID, @BookingID, @EmailCategory, @Metadata
    );
    
    SELECT SCOPE_IDENTITY() AS QueueID;
END
GO
