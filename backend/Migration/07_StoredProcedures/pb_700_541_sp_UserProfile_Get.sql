/*
    Migration Script: Create Stored Procedure [sp_UserProfile_Get]
    Phase: 700 - Stored Procedures
    Script: pb_700_541_sp_UserProfile_Get.sql
    Description: Gets user profile with all related data
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_GetUserProfile]') AND type in (N'P'))
    DROP PROCEDURE [users].[sp_GetUserProfile];
GO

CREATE PROCEDURE [users].[sp_GetUserProfile]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get user basic info
    SELECT 
        u.UserID, u.FirstName, u.LastName, u.Email, u.Phone,
        u.ProfileImageURL, u.IsVendor, u.CreatedAt, u.EmailVerified,
        YEAR(u.CreatedAt) as JoinYear,
        (SELECT COUNT(*) FROM bookings.Bookings WHERE UserID = u.UserID AND Status = 'completed') as CompletedBookings,
        (SELECT COUNT(*) FROM vendors.Reviews WHERE UserID = u.UserID) as ReviewsGiven
    FROM users.Users u
    WHERE u.UserID = @UserID AND u.IsDeleted = 0;
    
    -- Get user profile
    SELECT * FROM users.UserProfiles WHERE UserID = @UserID;
    
    -- Get user interests
    SELECT ui.Interest, ui.Category, ui.DisplayOrder
    FROM users.UserInterests ui
    INNER JOIN users.UserProfiles up ON ui.UserProfileID = up.UserProfileID
    WHERE up.UserID = @UserID
    ORDER BY ui.DisplayOrder;
    
    -- Get vendor profile if exists
    SELECT VendorProfileID, BusinessName, ResponseRate, AverageResponseTime as ResponseTime, 
           AvgRating as AverageRating, TotalReviews as ReviewCount
    FROM vendors.VendorProfiles
    WHERE UserID = @UserID AND IsVisible = 1;
END
GO

PRINT 'Created stored procedure [users].[sp_GetUserProfile]';
GO
