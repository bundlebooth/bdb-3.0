/*
    Migration Script: Create Stored Procedure [sp_LogEmail]
    Phase: 600 - Stored Procedures
    Script: cu_600_081_dbo.sp_LogEmail.sql
    Description: Creates the [admin].[sp_LogEmail] stored procedure
    
    Execution Order: 81
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_LogEmail]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_LogEmail]'))
    DROP PROCEDURE [admin].[sp_LogEmail];
GO

CREATE   PROCEDURE [admin].[sp_LogEmail]
    @TemplateKey NVARCHAR(50) = NULL, @RecipientEmail NVARCHAR(255), @RecipientName NVARCHAR(100) = NULL,
    @Subject NVARCHAR(255), @Status NVARCHAR(20) = 'sent', @ErrorMessage NVARCHAR(MAX) = NULL,
    @UserID INT = NULL, @BookingID INT = NULL, @Metadata NVARCHAR(MAX) = NULL, @HtmlBody NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO [admin].[EmailLogs] (TemplateKey, RecipientEmail, RecipientName, Subject, Status, ErrorMessage, UserID, BookingID, Metadata, HtmlBody)
    VALUES (@TemplateKey, @RecipientEmail, @RecipientName, @Subject, @Status, @ErrorMessage, @UserID, @BookingID, @Metadata, @HtmlBody);
    SELECT SCOPE_IDENTITY() AS EmailLogID;
END

GO

PRINT 'Stored procedure [admin].[sp_LogEmail] created successfully.';
GO
