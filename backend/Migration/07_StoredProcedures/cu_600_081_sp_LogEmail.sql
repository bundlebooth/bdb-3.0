/*
    Migration Script: Create Stored Procedure [sp_LogEmail]
    Phase: 600 - Stored Procedures
    Script: cu_600_081_dbo.sp_LogEmail.sql
    Description: Creates the [dbo].[sp_LogEmail] stored procedure
    
    Execution Order: 81
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_LogEmail]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_LogEmail]'))
    DROP PROCEDURE [dbo].[sp_LogEmail];
GO

CREATE   PROCEDURE [dbo].[sp_LogEmail]
    @TemplateKey NVARCHAR(50) = NULL, @RecipientEmail NVARCHAR(255), @RecipientName NVARCHAR(100) = NULL,
    @Subject NVARCHAR(255), @Status NVARCHAR(20) = 'sent', @ErrorMessage NVARCHAR(MAX) = NULL,
    @UserID INT = NULL, @BookingID INT = NULL, @Metadata NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO EmailLogs (TemplateKey, RecipientEmail, RecipientName, Subject, Status, ErrorMessage, UserID, BookingID, Metadata)
    VALUES (@TemplateKey, @RecipientEmail, @RecipientName, @Subject, @Status, @ErrorMessage, @UserID, @BookingID, @Metadata);
    SELECT SCOPE_IDENTITY() AS EmailLogID;
END

GO

PRINT 'Stored procedure [dbo].[sp_LogEmail] created successfully.';
GO
