-- =============================================
-- Stored Procedure: users.sp_GetMe
-- Description: Gets current user info
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetMe]'))
    DROP PROCEDURE [users].[sp_GetMe];
GO

CREATE PROCEDURE [users].[sp_GetMe]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.UserID as userId,
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) as name,
        u.Email as email,
        u.ProfileImageURL as avatar,
        u.IsVendor as isVendor,
        ul.City as city,
        ul.State as province,
        ul.Country as country,
        ul.Latitude as latitude,
        ul.Longitude as longitude
    FROM users.Users u
    LEFT JOIN (
        SELECT UserID, City, State, Country, Latitude, Longitude,
               ROW_NUMBER() OVER (PARTITION BY UserID ORDER BY Timestamp DESC) as rn
        FROM users.UserLocations
    ) ul ON u.UserID = ul.UserID AND ul.rn = 1
    WHERE u.UserID = @UserID;
END
GO

