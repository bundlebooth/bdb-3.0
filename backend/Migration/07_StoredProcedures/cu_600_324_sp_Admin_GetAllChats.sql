-- =============================================
-- Stored Procedure: sp_Admin_GetAllChats
-- Description: Gets all conversations for admin oversight
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetAllChats]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetAllChats];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetAllChats]
    @Filter NVARCHAR(50) = 'all',
    @Search NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        c.ConversationID,
        c.UserID,
        c.VendorProfileID,
        c.CreatedAt,
        u.UserID as ClientID,
        ISNULL(u.Name, 'Unknown Client') as ClientName,
        ISNULL(u.Email, 'No Email') as ClientEmail,
        vp.VendorProfileID,
        ISNULL(vp.BusinessName, 'Unknown Vendor') as VendorName,
        ISNULL(vu.Email, 'No Email') as VendorEmail,
        ISNULL(vu.Name, 'Unknown Owner') as VendorOwnerName,
        ISNULL((SELECT TOP 1 Content FROM Messages WHERE ConversationID = c.ConversationID ORDER BY CreatedAt DESC), 'No messages') as LastMessage,
        (SELECT TOP 1 CreatedAt FROM Messages WHERE ConversationID = c.ConversationID ORDER BY CreatedAt DESC) as LastMessageAt,
        ISNULL((SELECT COUNT(*) FROM Messages WHERE ConversationID = c.ConversationID), 0) as MessageCount,
        ISNULL((SELECT COUNT(*) FROM Messages WHERE ConversationID = c.ConversationID AND IsRead = 0), 0) as UnreadCount,
        0 as IsFlagged
    FROM Conversations c
    LEFT JOIN Users u ON c.UserID = u.UserID
    LEFT JOIN VendorProfiles vp ON c.VendorProfileID = vp.VendorProfileID
    LEFT JOIN Users vu ON vp.UserID = vu.UserID
    WHERE 
        (@Search IS NULL OR 
         u.Name LIKE '%' + @Search + '%' OR 
         u.Email LIKE '%' + @Search + '%' OR 
         vp.BusinessName LIKE '%' + @Search + '%')
    ORDER BY 
        CASE WHEN (SELECT TOP 1 CreatedAt FROM Messages WHERE ConversationID = c.ConversationID ORDER BY CreatedAt DESC) IS NULL 
             THEN c.CreatedAt 
             ELSE (SELECT TOP 1 CreatedAt FROM Messages WHERE ConversationID = c.ConversationID ORDER BY CreatedAt DESC) 
        END DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    SELECT COUNT(*) as total
    FROM Conversations c
    LEFT JOIN Users u ON c.UserID = u.UserID
    LEFT JOIN VendorProfiles vp ON c.VendorProfileID = vp.VendorProfileID
    WHERE 
        (@Search IS NULL OR 
         u.Name LIKE '%' + @Search + '%' OR 
         u.Email LIKE '%' + @Search + '%' OR 
         vp.BusinessName LIKE '%' + @Search + '%');
END
GO
