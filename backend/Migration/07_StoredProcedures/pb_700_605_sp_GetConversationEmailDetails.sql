-- =============================================
-- Stored Procedure: messages.sp_GetConversationEmailDetails
-- Description: Get vendor and client details for client_to_vendor email
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[messages].[sp_GetConversationEmailDetails]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [messages].[sp_GetConversationEmailDetails]
GO

CREATE PROCEDURE [messages].[sp_GetConversationEmailDetails]
    @VendorProfileID INT,
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        v.BusinessName, 
        v.BusinessEmail AS ContactEmail,
        u.FirstName AS ClientFirstName, 
        u.LastName AS ClientLastName, 
        u.Email AS ClientEmail
    FROM vendors.VendorProfiles v
    CROSS JOIN users.Users u
    WHERE v.VendorProfileID = @VendorProfileID AND u.UserID = @UserID
END
GO
