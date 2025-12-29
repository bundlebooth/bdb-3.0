/*
    Migration Script: Create Stored Procedure [sp_GetVendorOnlineStatus]
    Phase: 600 - Stored Procedures
    Script: cu_600_236_sp_Vendors_GetOnlineStatus.sql
    Description: Gets online status for vendors by their VendorProfileID
    Schema: vendors
    
    Execution Order: 236
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetOnlineStatus]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetOnlineStatus]'))
    DROP PROCEDURE [vendors].[sp_GetOnlineStatus];
GO

CREATE PROCEDURE [vendors].[sp_GetOnlineStatus]
    @VendorProfileID INT = NULL,
    @VendorProfileIDs NVARCHAR(MAX) = NULL  -- Comma-separated list of vendor profile IDs
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Online threshold: 5 minutes
    DECLARE @OnlineThreshold DATETIME = DATEADD(MINUTE, -5, GETDATE());
    
    IF @VendorProfileID IS NOT NULL
    BEGIN
        -- Single vendor query
        SELECT 
            v.VendorProfileID,
            v.BusinessName,
            u.UserID,
            u.LastActiveAt,
            CASE 
                WHEN u.LastActiveAt >= @OnlineThreshold THEN 1 
                ELSE 0 
            END AS IsOnline,
            CASE 
                WHEN u.LastActiveAt IS NULL THEN NULL
                ELSE DATEDIFF(MINUTE, u.LastActiveAt, GETDATE())
            END AS MinutesAgo
        FROM [vendors].[VendorProfiles] v
        JOIN [users].[Users] u ON v.UserID = u.UserID
        WHERE v.VendorProfileID = @VendorProfileID;
    END
    ELSE IF @VendorProfileIDs IS NOT NULL
    BEGIN
        -- Multiple vendors query using string split
        SELECT 
            v.VendorProfileID,
            v.BusinessName,
            u.UserID,
            u.LastActiveAt,
            CASE 
                WHEN u.LastActiveAt >= @OnlineThreshold THEN 1 
                ELSE 0 
            END AS IsOnline,
            CASE 
                WHEN u.LastActiveAt IS NULL THEN NULL
                ELSE DATEDIFF(MINUTE, u.LastActiveAt, GETDATE())
            END AS MinutesAgo
        FROM [vendors].[VendorProfiles] v
        JOIN [users].[Users] u ON v.UserID = u.UserID
        WHERE v.VendorProfileID IN (
            SELECT TRY_CAST(LTRIM(RTRIM(value)) AS INT) 
            FROM STRING_SPLIT(@VendorProfileIDs, ',')
            WHERE TRY_CAST(LTRIM(RTRIM(value)) AS INT) IS NOT NULL
        );
    END
END;
GO

PRINT 'Stored procedure [vendors].[sp_GetOnlineStatus] created successfully.';
GO
