/*
    Migration Script: Create Stored Procedure [sp_GetVendorDetails]
    Phase: 600 - Stored Procedures
    Script: cu_600_065_dbo.sp_GetVendorDetails.sql
    Description: Creates the [vendors].[sp_GetDetails] stored procedure
    
    Execution Order: 65
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetDetails]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetDetails]'))
    DROP PROCEDURE [vendors].[sp_GetDetails];
GO

CREATE   PROCEDURE [vendors].[sp_GetDetails]
    @VendorProfileID INT,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Vendor public profile (recordset 1)
    SELECT 
        vp.VendorProfileID,
        vp.BusinessName,
        vp.DisplayName,
        vp.BusinessDescription,
        vp.Tagline,
        vp.BusinessPhone,
        vp.Website,
        vp.YearsInBusiness,
        vp.IsVerified,
        vp.Address,
        vp.City,
        vp.State,
        vp.Country,
        vp.PostalCode,
        vp.Latitude,
        vp.Longitude,
        vp.IsPremium,
        vp.IsEcoFriendly,
        vp.IsAwardWinning,
        vp.IsLastMinute,
        vp.IsCertified,
        vp.IsInsured,
        vp.PriceLevel,
        vp.LogoURL,
        vp.StripeAccountID,
        -- Google Reviews Integration fields
        vp.GooglePlaceId,
        -- Profile review status fields
        vp.ProfileStatus,
        vp.RejectionReason,
        vp.SubmittedForReviewAt,
        vp.ReviewedAt,
        (SELECT COUNT(*) FROM users.Favorites f WHERE f.VendorProfileID = vp.VendorProfileID) AS FavoriteCount,
        (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM vendors.Reviews r WHERE r.VendorProfileID = vp.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
        (SELECT COUNT(*) FROM vendors.Reviews r WHERE r.VendorProfileID = vp.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
        (SELECT COUNT(*) FROM bookings.Bookings b WHERE b.VendorProfileID = vp.VendorProfileID) AS BookingCount,
        -- Host user info (the actual owner of the vendor)
        vp.UserID AS HostUserID,
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS HostName,
        u.ProfileImageURL AS HostProfileImage,
        u.CreatedAt AS HostMemberSince,
        -- Response metrics calculated from messages
        (SELECT 
            CASE 
                WHEN AVG(DATEDIFF(MINUTE, m.CreatedAt, mr.CreatedAt)) <= 60 THEN 'Within an hour'
                WHEN AVG(DATEDIFF(MINUTE, m.CreatedAt, mr.CreatedAt)) <= 180 THEN 'A few hours'
                WHEN AVG(DATEDIFF(MINUTE, m.CreatedAt, mr.CreatedAt)) <= 1440 THEN 'Within a day'
                ELSE 'A few days'
            END
         FROM messages.Messages m
         INNER JOIN messages.Messages mr ON mr.ConversationID = m.ConversationID 
            AND mr.SenderID = vp.UserID 
            AND mr.CreatedAt > m.CreatedAt
            AND mr.MessageID = (SELECT MIN(MessageID) FROM messages.Messages WHERE ConversationID = m.ConversationID AND SenderID = vp.UserID AND CreatedAt > m.CreatedAt)
         INNER JOIN messages.Conversations c ON c.ConversationID = m.ConversationID AND c.VendorProfileID = vp.VendorProfileID
         WHERE m.SenderID != vp.UserID
        ) AS ResponseTime,
        -- Response rating based on response rate
        (SELECT 
            CASE 
                WHEN COUNT(DISTINCT m.ConversationID) = 0 THEN NULL
                WHEN CAST(COUNT(DISTINCT mr.ConversationID) AS FLOAT) / NULLIF(COUNT(DISTINCT m.ConversationID), 0) >= 0.9 THEN 'Excellent'
                WHEN CAST(COUNT(DISTINCT mr.ConversationID) AS FLOAT) / NULLIF(COUNT(DISTINCT m.ConversationID), 0) >= 0.7 THEN 'Good'
                WHEN CAST(COUNT(DISTINCT mr.ConversationID) AS FLOAT) / NULLIF(COUNT(DISTINCT m.ConversationID), 0) >= 0.5 THEN 'Fair'
                ELSE 'Needs improvement'
            END
         FROM messages.Messages m
         INNER JOIN messages.Conversations c ON c.ConversationID = m.ConversationID AND c.VendorProfileID = vp.VendorProfileID
         LEFT JOIN messages.Messages mr ON mr.ConversationID = m.ConversationID AND mr.SenderID = vp.UserID AND mr.CreatedAt > m.CreatedAt
         WHERE m.SenderID != vp.UserID
        ) AS ResponseRating,
        -- Booking settings fields
        vp.MinBookingHours,
        vp.AdvanceNoticeHours,
        vp.MaxCapacity,
        vp.OffersHourlyRates,
        -- New vendor enhancement fields
        vp.InstantBookingEnabled,
        vp.MinBookingLeadTimeHours,
        vp.ServiceLocationScope,
        vp.YearsOfExperienceRange,
        vp.PriceType,
        vp.BasePrice
    FROM vendors.VendorProfiles vp
    LEFT JOIN users.Users u ON u.UserID = vp.UserID
    WHERE vp.VendorProfileID = @VendorProfileID;
    
    -- Vendor categories (recordset 2)
    SELECT Category, IsPrimary FROM vendors.VendorCategories WHERE VendorProfileID = @VendorProfileID ORDER BY IsPrimary DESC, Category;
    
    -- Services and packages (recordset 3) - UPDATED TO QUERY FROM vendors.Services TABLE
    SELECT 
        s.ServiceID AS VendorSelectedServiceID,
        s.LinkedPredefinedServiceID AS PredefinedServiceID,
        ps.ServiceName,
        ps.ServiceName AS Name,
        COALESCE(s.Description, ps.ServiceDescription) AS Description,
        ps.ServiceDescription AS ServiceDescription,
        s.Description AS VendorDescription,
        -- Derive a single Price compatible with display
        CASE 
            WHEN s.PricingModel = 'time_based' THEN s.BaseRate
            WHEN s.PricingModel = 'fixed_based' AND s.FixedPricingType = 'fixed_price' THEN s.FixedPrice
            WHEN s.PricingModel = 'fixed_based' AND s.FixedPricingType = 'per_attendee' THEN s.PricePerPerson
            ELSE COALESCE(s.Price, 0)
        END AS Price,
        COALESCE(s.BaseDurationMinutes, s.DurationMinutes, ps.DefaultDurationMinutes) AS DurationMinutes,
        0 AS MinDuration,
        COALESCE(s.MaximumAttendees, 0) AS MaxAttendees,
        0 AS RequiresDeposit,
        0 AS DepositPercentage,
        '' AS CancellationPolicy,
        s.IsActive,
        ps.Category AS CategoryName,
        0 AS CategoryID,
        NULL AS PrimaryImage,
        NULL AS ImageURL,
        -- Include unified pricing model fields for ServiceCard compatibility
        s.PricingModel,
        s.BaseRate,
        s.BaseDurationMinutes,
        s.OvertimeRatePerHour,
        s.MinimumBookingFee,
        s.FixedPricingType,
        s.FixedPrice,
        s.PricePerPerson,
        s.MinimumAttendees,
        s.MaximumAttendees AS Capacity,
        s.SalePrice
    FROM vendors.Services s
    LEFT JOIN admin.PredefinedServices ps ON ps.PredefinedServiceID = s.LinkedPredefinedServiceID
    WHERE s.VendorProfileID = @VendorProfileID 
        AND s.LinkedPredefinedServiceID IS NOT NULL 
        AND s.IsActive = 1
    ORDER BY ps.Category, ps.DisplayOrder, ps.ServiceName;
    
    -- Vendor portfolio (recordset 4)
    SELECT PortfolioID, Title, Description, ImageURL, ProjectDate, DisplayOrder
    FROM vendors.VendorPortfolio
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DisplayOrder;

    -- Vendor reviews (recordset 5)
    SELECT ReviewID, ReviewerName, Rating, Comment, CreatedAt
    FROM vw_VendorReviews 
    WHERE VendorProfileID = @VendorProfileID 
    ORDER BY CreatedAt DESC;

    -- Vendor FAQs (recordset 6)
    SELECT FAQID, Question, Answer, AnswerType, AnswerOptions, DisplayOrder, IsActive
    FROM vendors.VendorFAQs
    WHERE VendorProfileID = @VendorProfileID AND IsActive = 1
    ORDER BY DisplayOrder;

    -- Vendor team (recordset 7) - Return empty result as table doesn't exist yet
    SELECT 
        CAST(NULL AS INT) AS TeamID, 
        CAST(NULL AS NVARCHAR(100)) AS Name, 
        CAST(NULL AS NVARCHAR(100)) AS Role, 
        CAST(NULL AS NVARCHAR(MAX)) AS Bio, 
        CAST(NULL AS NVARCHAR(500)) AS ImageURL, 
        CAST(NULL AS INT) AS DisplayOrder
    WHERE 1 = 0;

    -- Vendor social media (recordset 8)
    SELECT SocialID, Platform, URL, DisplayOrder
    FROM vendors.VendorSocialMedia 
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DisplayOrder;

    -- Vendor business hours (recordset 9)
    SELECT DayOfWeek, OpenTime, CloseTime, IsAvailable, Timezone
    FROM vendors.VendorBusinessHours
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DayOfWeek;

    -- Vendor images (recordset 10)
    SELECT ImageID, ImageURL, IsPrimary, DisplayOrder, ImageType
    FROM vendors.VendorImages
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY IsPrimary DESC, DisplayOrder;

    -- Category-specific questions and answers (recordset 11)
    SELECT cq.QuestionText, vad.Answer
    FROM vendors.VendorCategoryAnswers vad
    JOIN admin.CategoryQuestions cq ON vad.QuestionID = cq.QuestionID
    WHERE vad.VendorProfileID = @VendorProfileID;

    -- Is favorite for current user (recordset 12)
    IF @UserID IS NOT NULL
    BEGIN
        SELECT CAST(CASE WHEN EXISTS (SELECT 1 FROM users.Favorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID) THEN 1 ELSE 0 END AS BIT) AS IsFavorite;
    END

    -- Available time slots (recordset 13)
    DECLARE @Today DATE = GETDATE();
    DECLARE @EndDate DATE = DATEADD(DAY, 30, @Today);
    
    SELECT 
        ts.SlotID,
        ts.ServiceID,
        ts.DayOfWeek,
        ts.Date,
        ts.StartTime,
        ts.EndTime,
        ts.MaxCapacity,
        (SELECT COUNT(*) FROM bookings.Bookings b 
         WHERE b.ServiceID = ts.ServiceID 
         AND b.Status NOT IN ('cancelled', 'rejected')
         AND (
             (ts.Date IS NOT NULL AND CONVERT(DATE, b.EventDate) = ts.Date)
             OR
             (ts.Date IS NULL AND DATEPART(WEEKDAY, b.EventDate) = ts.DayOfWeek + 1)
         )
         AND CONVERT(TIME, b.EventDate) BETWEEN ts.StartTime AND ts.EndTime
        ) AS BookedCount
    FROM bookings.TimeSlots ts
    JOIN vendors.Services s ON ts.ServiceID = s.ServiceID
    WHERE s.VendorProfileID = @VendorProfileID
    AND ts.IsAvailable = 1
    AND (
        (ts.Date IS NULL) OR
        (ts.Date BETWEEN @Today AND @EndDate)
    )
    ORDER BY 
        CASE WHEN ts.Date IS NULL THEN DATEADD(DAY, ts.DayOfWeek - DATEPART(WEEKDAY, @Today) + 7, @Today)
             ELSE ts.Date
        END,
        ts.StartTime;
END;
GO

PRINT 'Stored procedure [vendors].[sp_GetDetails] created successfully.';
GO









