/*
    Migration Script: Create View [vw_VendorResponseTimes]
    Phase: 400 - Views
    Script: cu_400_11_dbo.vw_VendorResponseTimes.sql
    Description: Creates the [vendors].[vw_VendorResponseTimes] view
    
    Execution Order: 11
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [vendors].[vw_VendorResponseTimes]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[vendors].[vw_VendorResponseTimes]'))
    DROP VIEW [vendors].[vw_VendorResponseTimes];
GO

CREATE VIEW [vendors].[vw_VendorResponseTimes]
WITH SCHEMABINDING
AS
SELECT 
    vp.VendorProfileID,
    AVG(DATEDIFF(MINUTE, m1.CreatedAt, m2.CreatedAt)) AS AvgResponseMinutes,
    COUNT_BIG(*) AS ResponseCount
FROM vendors.VendorProfiles vp
INNER JOIN messages.Conversations c ON vp.VendorProfileID = c.VendorProfileID
INNER JOIN messages.Messages m1 ON c.ConversationID = m1.ConversationID
INNER JOIN messages.Messages m2 ON c.ConversationID = m2.ConversationID
INNER JOIN users.Users u1 ON m1.SenderID = u1.UserID
INNER JOIN users.Users u2 ON m2.SenderID = u2.UserID
WHERE u1.UserID = c.UserID
  AND u2.UserID = vp.UserID
  AND m2.CreatedAt > m1.CreatedAt
  AND DATEDIFF(MINUTE, m1.CreatedAt, m2.CreatedAt) <= 1440
GROUP BY vp.VendorProfileID;
GO

PRINT 'View [vendors].[vw_VendorResponseTimes] created successfully.';
GO
