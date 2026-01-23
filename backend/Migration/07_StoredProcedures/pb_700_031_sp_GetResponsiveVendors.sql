/*
    Migration Script: Create Stored Procedure [vendors.sp_GetResponsive]
    Phase: 600 - Stored Procedures
    Script: cu_600_045_sp_GetResponsiveVendors.sql
    Description: Creates the [vendors].[sp_GetResponsive] stored procedure
    Schema: vendors
    Execution Order: 45
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetResponsive]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetResponsive]'))
    DROP PROCEDURE [vendors].[sp_GetResponsive];
GO

CREATE PROCEDURE [vendors].[sp_GetResponsive]
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) vp.*,
        vrt.AvgResponseMinutes
    FROM vendors.VendorProfiles vp
    INNER JOIN (
        SELECT c.VendorProfileID, 
               AVG(DATEDIFF(MINUTE, m_user.CreatedAt, m_vendor.CreatedAt)) AS AvgResponseMinutes
        FROM messages.Conversations c
        INNER JOIN messages.Messages m_user ON c.ConversationID = m_user.ConversationID AND m_user.SenderID = c.UserID
        INNER JOIN messages.Messages m_vendor ON c.ConversationID = m_vendor.ConversationID AND m_vendor.SenderID != c.UserID
        WHERE m_vendor.CreatedAt > m_user.CreatedAt
        GROUP BY c.VendorProfileID
        HAVING AVG(DATEDIFF(MINUTE, m_user.CreatedAt, m_vendor.CreatedAt)) <= 120
    ) vrt ON vp.VendorProfileID = vrt.VendorProfileID
    WHERE ISNULL(vp.IsVisible, 0) = 1
      AND (@City IS NULL OR vp.City = @City)
    ORDER BY vrt.AvgResponseMinutes ASC;
END
GO

PRINT 'Stored procedure [vendors].[sp_GetResponsive] created successfully.';
GO



