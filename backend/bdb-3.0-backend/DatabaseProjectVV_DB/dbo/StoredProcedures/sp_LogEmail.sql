
-- Log sent email
CREATE   PROCEDURE sp_LogEmail
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

