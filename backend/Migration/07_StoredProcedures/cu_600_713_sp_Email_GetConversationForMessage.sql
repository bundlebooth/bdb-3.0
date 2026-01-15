/*
    Migration Script: Create Stored Procedure [email.sp_GetConversationForMessage]
    Phase: 600 - Stored Procedures
    Description: Gets conversation details for message email notification
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [email].[sp_GetConversationForMessage]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[email].[sp_GetConversationForMessage]'))
    DROP PROCEDURE [email].[sp_GetConversationForMessage];
GO

CREATE PROCEDURE [email].[sp_GetConversationForMessage]
    @ConversationID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.UserID,
        c.VendorProfileID,
        u.Name AS ClientName,
        u.Email AS ClientEmail,
        u.ProfileImageURL AS ClientProfilePic,
        vp.BusinessName AS VendorName,
        vp.LogoUrl AS VendorLogoUrl,
        vu.UserID AS VendorUserID,
        vu.Email AS VendorEmail,
        vu.ProfileImageURL AS VendorProfilePic
    FROM messages.Conversations c
    INNER JOIN users.Users u ON c.UserID = u.UserID
    INNER JOIN vendors.VendorProfiles vp ON c.VendorProfileID = vp.VendorProfileID
    INNER JOIN users.Users vu ON vp.UserID = vu.UserID
    WHERE c.ConversationID = @ConversationID;
END
GO

PRINT 'Stored procedure [email].[sp_GetConversationForMessage] created successfully.';
GO
