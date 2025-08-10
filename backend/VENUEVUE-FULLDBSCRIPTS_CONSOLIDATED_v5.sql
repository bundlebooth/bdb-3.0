-- COMPLETE DATABASE DDL SCRIPT
-- Database: VV_DB
-- Generated: 2025-08-10 21:18:07
-- Creation order: Tables ? Views ? Functions ? Procedures ? Triggers
--
-- To save: Right-click in Messages tab ? "Save Results As..." ? .sql file
-- =============================================

-- =============================================
-- TABLES (with constraints)
-- =============================================

-- Table: [dbo].[Bookings]
CREATE TABLE [dbo].[Bookings] (
    [BookingID] int NOT NULL,
    [UserID] int NULL,
    [VendorProfileID] int NULL,
    [ServiceID] int NULL,
    [BookingDate] datetime NULL,
    [EventDate] datetime NOT NULL,
    [EndDate] datetime NULL,
    [Status] nvarchar(40) NULL,
    [TotalAmount] decimal(10,2) NULL,
    [DepositAmount] decimal(10,2) NULL,
    [DepositPaid] bit NULL,
    [FullAmountPaid] bit NULL,
    [AttendeeCount] int NULL,
    [SpecialRequests] nvarchar(MAX) NULL,
    [CancellationDate] datetime NULL,
    [RefundAmount] decimal(10,2) NULL,
    [StripePaymentIntentID] nvarchar(200) NULL,
    [CreatedAt] datetime NULL,
    [UpdatedAt] datetime NULL
);
GO

-- Table: [dbo].[BookingServices]
CREATE TABLE [dbo].[BookingServices] (
    [BookingServiceID] int NOT NULL,
    [BookingID] int NULL,
    [ServiceID] int NULL,
    [AddOnID] int NULL,
    [Quantity] int NULL,
    [PriceAtBooking] decimal(10,2) NOT NULL,
    [Notes] nvarchar(MAX) NULL
);
GO

-- Table: [dbo].[BookingTimeline]
CREATE TABLE [dbo].[BookingTimeline] (
    [TimelineID] int NOT NULL,
    [BookingID] int NULL,
    [Status] nvarchar(100) NOT NULL,
    [ChangedBy] int NULL,
    [Notes] nvarchar(MAX) NULL,
    [CreatedAt] datetime NULL
);
GO

-- Table: [dbo].[Conversations]
CREATE TABLE [dbo].[Conversations] (
    [ConversationID] int NOT NULL,
    [UserID] int NULL,
    [VendorProfileID] int NULL,
    [BookingID] int NULL,
    [Subject] nvarchar(510) NULL,
    [LastMessageAt] datetime NULL,
    [CreatedAt] datetime NULL,
    [UpdatedAt] datetime NULL
);
GO

-- Table: [dbo].[Favorites]
CREATE TABLE [dbo].[Favorites] (
    [FavoriteID] int NOT NULL,
    [UserID] int NULL,
    [VendorProfileID] int NULL,
    [CreatedAt] datetime NULL
);
GO

-- Table: [dbo].[MessageAttachments]
CREATE TABLE [dbo].[MessageAttachments] (
    [AttachmentID] int NOT NULL,
    [MessageID] int NULL,
    [FileURL] nvarchar(510) NOT NULL,
    [FileType] nvarchar(100) NULL,
    [FileSize] int NULL,
    [OriginalName] nvarchar(510) NULL
);
GO

-- Table: [dbo].[Messages]
CREATE TABLE [dbo].[Messages] (
    [MessageID] int NOT NULL,
    [ConversationID] int NULL,
    [SenderID] int NULL,
    [Content] nvarchar(MAX) NOT NULL,
    [IsRead] bit NULL,
    [ReadAt] datetime NULL,
    [CreatedAt] datetime NULL
);
GO

-- Table: [dbo].[Notifications]
CREATE TABLE [dbo].[Notifications] (
    [NotificationID] int NOT NULL,
    [UserID] int NULL,
    [Type] nvarchar(100) NOT NULL,
    [Title] nvarchar(200) NOT NULL,
    [Message] nvarchar(MAX) NOT NULL,
    [IsRead] bit NULL,
    [ReadAt] datetime NULL,
    [RelatedID] int NULL,
    [RelatedType] nvarchar(100) NULL,
    [ActionURL] nvarchar(510) NULL,
    [CreatedAt] datetime NULL
);
GO

-- Table: [dbo].[Packages]
CREATE TABLE [dbo].[Packages] (
    [PackageID] int NOT NULL,
    [VendorProfileID] int NULL,
    [Name] nvarchar(200) NOT NULL,
    [Description] nvarchar(MAX) NULL,
    [Price] decimal(10,2) NOT NULL,
    [DurationMinutes] int NULL,
    [MaxGuests] int NULL,
    [WhatsIncluded] nvarchar(MAX) NULL,
    [IsActive] bit NULL,
    [DisplayOrder] int NULL,
    [CreatedAt] datetime NULL,
    [UpdatedAt] datetime NULL
);
GO

-- Table: [dbo].[PaymentMethods]
CREATE TABLE [dbo].[PaymentMethods] (
    [PaymentMethodID] int NOT NULL,
    [UserID] int NULL,
    [StripePaymentMethodID] nvarchar(200) NOT NULL,
    [IsDefault] bit NULL,
    [CardBrand] nvarchar(100) NULL,
    [Last4] nvarchar(8) NULL,
    [ExpMonth] int NULL,
    [ExpYear] int NULL,
    [CreatedAt] datetime NULL
);
GO

-- Table: [dbo].[ReviewMedia]
CREATE TABLE [dbo].[ReviewMedia] (
    [MediaID] int NOT NULL,
    [ReviewID] int NULL,
    [ImageURL] nvarchar(510) NOT NULL,
    [DisplayOrder] int NULL
);
GO

-- Table: [dbo].[Reviews]
CREATE TABLE [dbo].[Reviews] (
    [ReviewID] int NOT NULL,
    [UserID] int NULL,
    [VendorProfileID] int NULL,
    [BookingID] int NULL,
    [Rating] tinyint NOT NULL,
    [Title] nvarchar(200) NULL,
    [Comment] nvarchar(MAX) NULL,
    [Response] nvarchar(MAX) NULL,
    [ResponseDate] datetime NULL,
    [IsAnonymous] bit NULL,
    [IsFeatured] bit NULL,
    [IsApproved] bit NULL,
    [CreatedAt] datetime NULL,
    [UpdatedAt] datetime NULL
);
GO

-- Table: [dbo].[SearchHistory]
CREATE TABLE [dbo].[SearchHistory] (
    [SearchID] int NOT NULL,
    [UserID] int NULL,
    [SearchTerm] nvarchar(510) NULL,
    [Category] nvarchar(100) NULL,
    [Location] nvarchar(510) NULL,
    [Filters] nvarchar(MAX) NULL,
    [Timestamp] datetime NULL
);
GO

-- Table: [dbo].[ServiceAddOns]
CREATE TABLE [dbo].[ServiceAddOns] (
    [AddOnID] int NOT NULL,
    [ServiceID] int NULL,
    [Name] nvarchar(200) NOT NULL,
    [Description] nvarchar(MAX) NULL,
    [Price] decimal(10,2) NOT NULL,
    [IsActive] bit NULL
);
GO

-- Table: [dbo].[ServiceAvailability]
CREATE TABLE [dbo].[ServiceAvailability] (
    [AvailabilityID] int NOT NULL,
    [ServiceID] int NULL,
    [StartDateTime] datetime NOT NULL,
    [EndDateTime] datetime NOT NULL,
    [IsAvailable] bit NULL,
    [Reason] nvarchar(510) NULL,
    [CreatedAt] datetime NULL
);
GO

-- Table: [dbo].[ServiceCategories]
CREATE TABLE [dbo].[ServiceCategories] (
    [CategoryID] int NOT NULL,
    [VendorProfileID] int NULL,
    [Name] nvarchar(200) NOT NULL,
    [Description] nvarchar(MAX) NULL,
    [DisplayOrder] int NULL,
    [CreatedAt] datetime NULL,
    [UpdatedAt] datetime NULL
);
GO

-- Table: [dbo].[ServiceImages]
CREATE TABLE [dbo].[ServiceImages] (
    [ImageID] int NOT NULL,
    [ServiceID] int NULL,
    [ImageURL] nvarchar(510) NOT NULL,
    [IsPrimary] bit NULL,
    [DisplayOrder] int NULL
);
GO

-- Table: [dbo].[Services]
CREATE TABLE [dbo].[Services] (
    [ServiceID] int NOT NULL,
    [CategoryID] int NULL,
    [Name] nvarchar(200) NOT NULL,
    [Description] nvarchar(MAX) NULL,
    [Price] decimal(10,2) NOT NULL,
    [DurationMinutes] int NULL,
    [MinDuration] int NULL,
    [MaxAttendees] int NULL,
    [IsActive] bit NULL,
    [RequiresDeposit] bit NULL,
    [DepositPercentage] decimal(5,2) NULL,
    [CancellationPolicy] nvarchar(MAX) NULL,
    [CreatedAt] datetime NULL,
    [UpdatedAt] datetime NULL,
    [ServiceType] nvarchar(40) NULL
);
GO

-- Table: [dbo].[TimeSlots]
CREATE TABLE [dbo].[TimeSlots] (
    [SlotID] int NOT NULL,
    [VendorProfileID] int NULL,
    [ServiceID] int NULL,
    [DayOfWeek] tinyint NULL,
    [Date] date NULL,
    [StartTime] time NOT NULL,
    [EndTime] time NOT NULL,
    [MaxCapacity] int NULL,
    [IsAvailable] bit NULL
);
GO

-- Table: [dbo].[Transactions]
CREATE TABLE [dbo].[Transactions] (
    [TransactionID] int NOT NULL,
    [UserID] int NULL,
    [VendorProfileID] int NULL,
    [BookingID] int NULL,
    [Amount] decimal(10,2) NOT NULL,
    [FeeAmount] decimal(10,2) NULL,
    [NetAmount] decimal(10,2) NULL,
    [Currency] nvarchar(6) NULL,
    [Description] nvarchar(510) NULL,
    [StripeChargeID] nvarchar(200) NULL,
    [Status] nvarchar(40) NOT NULL,
    [CreatedAt] datetime NULL
);
GO

-- Table: [dbo].[UserLocations]
CREATE TABLE [dbo].[UserLocations] (
    [LocationID] int NOT NULL,
    [UserID] int NULL,
    [Latitude] decimal(10,8) NOT NULL,
    [Longitude] decimal(11,8) NOT NULL,
    [City] nvarchar(200) NULL,
    [State] nvarchar(100) NULL,
    [Country] nvarchar(100) NULL,
    [Timestamp] datetime NULL
);
GO

-- Table: [dbo].[Users]
CREATE TABLE [dbo].[Users] (
    [UserID] int NOT NULL,
    [Name] nvarchar(200) NOT NULL,
    [Email] nvarchar(200) NOT NULL,
    [PasswordHash] nvarchar(510) NULL,
    [Avatar] nvarchar(510) NULL,
    [Phone] nvarchar(40) NULL,
    [Bio] nvarchar(MAX) NULL,
    [IsVendor] bit NULL,
    [IsAdmin] bit NULL,
    [EmailVerified] bit NULL,
    [CreatedAt] datetime NULL,
    [UpdatedAt] datetime NULL,
    [LastLogin] datetime NULL,
    [AuthProvider] nvarchar(40) NULL,
    [StripeCustomerID] nvarchar(200) NULL,
    [NotificationPreferences] nvarchar(MAX) NULL,
    [IsActive] bit NULL
);
GO

-- Constraints for: [dbo].[Users]
ALTER TABLE [dbo].[Users] ADD CONSTRAINT [PK__Users__1788CCAC0EA41595] PRIMARY KEY NONCLUSTERED
([UserID] ASC);
GO
-- Table: [dbo].[UserSessions]
CREATE TABLE [dbo].[UserSessions] (
    [SessionID] int NOT NULL,
    [UserID] int NULL,
    [Token] nvarchar(510) NOT NULL,
    [IPAddress] nvarchar(100) NULL,
    [UserAgent] nvarchar(510) NULL,
    [CreatedAt] datetime NULL,
    [ExpiresAt] datetime NOT NULL,
    [IsActive] bit NULL
);
GO

-- Table: [dbo].[VendorAvailabilityExceptions]
CREATE TABLE [dbo].[VendorAvailabilityExceptions] (
    [ExceptionID] int NOT NULL,
    [VendorProfileID] int NULL,
    [StartDate] date NOT NULL,
    [EndDate] date NOT NULL,
    [StartTime] time NULL,
    [EndTime] time NULL,
    [IsAvailable] bit NULL,
    [Reason] nvarchar(510) NULL,
    [CreatedAt] datetime NULL
);
GO

-- Table: [dbo].[VendorBusinessHours]
CREATE TABLE [dbo].[VendorBusinessHours] (
    [HoursID] int NOT NULL,
    [VendorProfileID] int NULL,
    [DayOfWeek] tinyint NOT NULL,
    [OpenTime] time NULL,
    [CloseTime] time NULL,
    [IsAvailable] bit NULL
);
GO

-- Table: [dbo].[VendorCategories]
CREATE TABLE [dbo].[VendorCategories] (
    [VendorCategoryID] int NOT NULL,
    [VendorProfileID] int NULL,
    [Category] nvarchar(100) NOT NULL
);
GO

-- Table: [dbo].[VendorFAQs]
CREATE TABLE [dbo].[VendorFAQs] (
    [FAQID] int NOT NULL,
    [VendorProfileID] int NULL,
    [Question] nvarchar(510) NOT NULL,
    [Answer] nvarchar(MAX) NOT NULL,
    [DisplayOrder] int NULL,
    [CreatedAt] datetime NULL
);
GO

-- Table: [dbo].[VendorImages]
CREATE TABLE [dbo].[VendorImages] (
    [ImageID] int NOT NULL,
    [VendorProfileID] int NULL,
    [ImageURL] nvarchar(510) NOT NULL,
    [IsPrimary] bit NULL,
    [DisplayOrder] int NULL,
    [Caption] nvarchar(510) NULL,
    [ImageType] nvarchar(20) NULL,
    [CloudinaryPublicId] nvarchar(510) NULL
);
GO

-- Table: [dbo].[VendorPortfolio]
CREATE TABLE [dbo].[VendorPortfolio] (
    [PortfolioID] int NOT NULL,
    [VendorProfileID] int NULL,
    [Title] nvarchar(200) NOT NULL,
    [Description] nvarchar(MAX) NULL,
    [ImageURL] nvarchar(510) NOT NULL,
    [ProjectDate] date NULL,
    [DisplayOrder] int NULL,
    [CreatedAt] datetime NULL,
    [CloudinaryPublicId] nvarchar(510) NULL
);
GO

-- Table: [dbo].[VendorProfiles]
CREATE TABLE [dbo].[VendorProfiles] (
    [VendorProfileID] int NOT NULL,
    [UserID] int NULL,
    [BusinessName] nvarchar(200) NULL,
    [DisplayName] nvarchar(200) NULL,
    [BusinessDescription] nvarchar(MAX) NULL,
    [Tagline] nvarchar(510) NULL,
    [BusinessPhone] nvarchar(40) NULL,
    [BusinessEmail] nvarchar(200) NULL,
    [Website] nvarchar(510) NULL,
    [YearsInBusiness] int NULL,
    [LicenseNumber] nvarchar(100) NULL,
    [InsuranceVerified] bit NULL,
    [IsVerified] bit NULL,
    [IsCompleted] bit NULL,
    [StripeAccountID] nvarchar(200) NULL,
    [AverageResponseTime] int NULL,
    [ResponseRate] decimal(5,2) NULL,
    [Address] nvarchar(510) NULL,
    [City] nvarchar(200) NULL,
    [State] nvarchar(100) NULL,
    [Country] nvarchar(100) NULL,
    [PostalCode] nvarchar(40) NULL,
    [Latitude] decimal(10,8) NULL,
    [Longitude] decimal(11,8) NULL,
    [IsPremium] bit NULL,
    [IsEcoFriendly] bit NULL,
    [IsAwardWinning] bit NULL,
    [PriceLevel] nvarchar(20) NULL,
    [Capacity] int NULL,
    [Rooms] int NULL,
    [FeaturedImageURL] nvarchar(510) NULL,
    [BookingLink] nvarchar(510) NULL,
    [AcceptingBookings] bit NULL,
    [CreatedAt] datetime NULL,
    [UpdatedAt] datetime NULL,
    [SetupStep] int NULL,
    [SetupCompleted] bit NULL,
    [GalleryCompleted] bit NULL,
    [PackagesCompleted] bit NULL,
    [ServicesCompleted] bit NULL,
    [SocialMediaCompleted] bit NULL,
    [AvailabilityCompleted] bit NULL,
    [DepositRequirements] nvarchar(MAX) NULL,
    [CancellationPolicy] nvarchar(MAX) NULL,
    [ReschedulingPolicy] nvarchar(MAX) NULL,
    [PaymentMethods] nvarchar(MAX) NULL,
    [PaymentTerms] nvarchar(MAX) NULL,
    [Awards] nvarchar(MAX) NULL,
    [Certifications] nvarchar(MAX) NULL
);
GO

-- Table: [dbo].[VendorServiceAreas]
CREATE TABLE [dbo].[VendorServiceAreas] (
    [AreaID] int NOT NULL,
    [VendorProfileID] int NULL,
    [City] nvarchar(200) NOT NULL,
    [State] nvarchar(100) NOT NULL,
    [Country] nvarchar(100) NOT NULL,
    [RadiusMiles] int NULL,
    [AdditionalFee] decimal(10,2) NULL
);
GO

-- Table: [dbo].[VendorSocialMedia]
CREATE TABLE [dbo].[VendorSocialMedia] (
    [SocialID] int NOT NULL,
    [VendorProfileID] int NULL,
    [Platform] nvarchar(100) NOT NULL,
    [URL] nvarchar(510) NOT NULL,
    [DisplayOrder] int NULL
);
GO

-- Table: [dbo].[VendorTeam]
CREATE TABLE [dbo].[VendorTeam] (
    [TeamMemberID] int NOT NULL,
    [VendorProfileID] int NULL,
    [Name] nvarchar(200) NOT NULL,
    [Role] nvarchar(200) NULL,
    [Bio] nvarchar(MAX) NULL,
    [ImageURL] nvarchar(510) NULL,
    [DisplayOrder] int NULL
);
GO

-- =============================================
-- VIEWS
-- =============================================

-- View: [dbo].[vw_UserBookings]

-- User bookings view
CREATE   VIEW vw_UserBookings AS
SELECT 
    b.BookingID,
    b.UserID,
    b.VendorProfileID,
    vp.BusinessName AS VendorName,
    b.ServiceID,
    s.Name AS ServiceName,
    b.EventDate,
    b.EndDate,
    b.Status,
    b.TotalAmount,
    b.DepositAmount,
    b.DepositPaid,
    b.FullAmountPaid,
    b.AttendeeCount,
    b.SpecialRequests,
    (SELECT TOP 1 si.ImageURL FROM ServiceImages si WHERE si.ServiceID = s.ServiceID AND si.IsPrimary = 1) AS ServiceImage,
    (SELECT COUNT(*) FROM Messages m JOIN Conversations c ON m.ConversationID = c.ConversationID 
      WHERE c.BookingID = b.BookingID AND m.IsRead = 0 AND m.SenderID != b.UserID) AS UnreadMessages
FROM Bookings b
JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
JOIN Services s ON b.ServiceID = s.ServiceID;
GO

-- View: [dbo].[vw_UserConversations]

-- User conversations view
CREATE   VIEW vw_UserConversations AS
SELECT 
    c.ConversationID,
    c.UserID,
    c.VendorProfileID,
    v.BusinessName AS VendorName,
    c.BookingID,
    b.ServiceID,
    s.Name AS ServiceName,
    c.Subject,
    c.LastMessageAt,
    (SELECT COUNT(*) FROM Messages m WHERE m.ConversationID = c.ConversationID AND m.IsRead = 0 AND m.SenderID != c.UserID) AS UnreadCount,
    (SELECT TOP 1 m.Content FROM Messages m WHERE m.ConversationID = c.ConversationID ORDER BY m.CreatedAt DESC) AS LastMessagePreview
FROM Conversations c
JOIN VendorProfiles v ON c.VendorProfileID = v.VendorProfileID
LEFT JOIN Bookings b ON c.BookingID = b.BookingID
LEFT JOIN Services s ON b.ServiceID = s.ServiceID;
GO

-- View: [dbo].[vw_UserFavorites]

-- User favorites view
CREATE   VIEW vw_UserFavorites AS
SELECT 
    f.FavoriteID,
    f.UserID,
    f.VendorProfileID,
    v.BusinessName AS VendorName,
    v.BusinessDescription,
    (SELECT STRING_AGG(vc.Category, ', ') FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories,
    (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
    (SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
    (SELECT TOP 1 p.ImageURL FROM VendorPortfolio p WHERE p.VendorProfileID = v.VendorProfileID ORDER BY p.DisplayOrder) AS PortfolioImage,
    f.CreatedAt
FROM Favorites f
JOIN VendorProfiles v ON f.VendorProfileID = v.VendorProfileID;
GO

-- View: [dbo].[vw_UserNotifications]

-- User notifications view
CREATE   VIEW vw_UserNotifications AS
SELECT 
    n.NotificationID,
    n.UserID,
    n.Type,
    n.Title,
    n.Message,
    n.IsRead,
    n.ReadAt,
    n.RelatedID,
    n.RelatedType,
    n.ActionURL,
    n.CreatedAt,
    CASE 
        WHEN n.Type = 'booking' THEN (SELECT b.Status FROM Bookings b WHERE b.BookingID = n.RelatedID)
        WHEN n.Type = 'message' THEN (SELECT c.Subject FROM Messages m JOIN Conversations c ON m.ConversationID = c.ConversationID WHERE m.MessageID = n.RelatedID)
        ELSE NULL
    END AS Status
FROM Notifications n;
GO

-- View: [dbo].[vw_VendorBookings]

-- Vendor bookings view
CREATE   VIEW vw_VendorBookings AS
SELECT 
    b.BookingID,
    b.VendorProfileID,
    b.UserID,
    u.Name AS ClientName,
    u.Email AS ClientEmail,
    u.Phone AS ClientPhone,
    b.ServiceID,
    s.Name AS ServiceName,
    b.EventDate,
    b.EndDate,
    b.Status,
    b.TotalAmount,
    b.DepositAmount,
    b.DepositPaid,
    b.FullAmountPaid,
    b.AttendeeCount,
    b.SpecialRequests,
    (SELECT COUNT(*) FROM Messages m JOIN Conversations c ON m.ConversationID = c.ConversationID 
      WHERE c.BookingID = b.BookingID AND m.IsRead = 0 AND m.SenderID = b.UserID) AS UnreadMessages,
    (SELECT TOP 1 r.Rating FROM Reviews r WHERE r.BookingID = b.BookingID) AS ReviewRating
FROM Bookings b
JOIN Users u ON b.UserID = u.UserID
JOIN Services s ON b.ServiceID = s.ServiceID;
GO

-- View: [dbo].[vw_VendorConversations]

-- Vendor conversations view
CREATE   VIEW vw_VendorConversations AS
SELECT 
    c.ConversationID,
    c.VendorProfileID,
    c.UserID,
    u.Name AS UserName,
    u.Avatar AS UserAvatar,
    c.BookingID,
    b.ServiceID,
    s.Name AS ServiceName,
    c.Subject,
    c.LastMessageAt,
    (SELECT COUNT(*) FROM Messages m WHERE m.ConversationID = c.ConversationID AND m.IsRead = 0 AND m.SenderID = c.UserID) AS UnreadCount,
    (SELECT TOP 1 m.Content FROM Messages m WHERE m.ConversationID = c.ConversationID ORDER BY m.CreatedAt DESC) AS LastMessagePreview
FROM Conversations c
JOIN Users u ON c.UserID = u.UserID
LEFT JOIN Bookings b ON c.BookingID = b.BookingID
LEFT JOIN Services s ON b.ServiceID = s.ServiceID;
GO

-- View: [dbo].[vw_VendorDetails]

-- ======================
-- VIEWS
-- ======================

-- Vendor details view
CREATE   VIEW vw_VendorDetails AS
SELECT 
    v.VendorProfileID,
    v.UserID,
    u.Name AS OwnerName,
    u.Email AS OwnerEmail,
    u.Phone AS OwnerPhone,
    v.BusinessName,
    v.DisplayName,
    v.Tagline,
    v.BusinessDescription,
    v.BusinessPhone,
    v.BusinessEmail,
    v.Website,
    v.YearsInBusiness,
    v.LicenseNumber,
    v.InsuranceVerified,
    v.IsVerified,
    v.IsCompleted,
    v.AverageResponseTime,
    v.ResponseRate,
    v.Address,
    v.City,
    v.State,
    v.Country,
    v.PostalCode,
    v.Latitude,
    v.Longitude,
    v.IsPremium,
    v.IsEcoFriendly,
    v.IsAwardWinning,
    v.PriceLevel,
    v.Capacity,
    v.Rooms,
    v.FeaturedImageURL,
    v.BookingLink,
    v.AcceptingBookings,
    (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) AS FavoriteCount,
    (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
    (SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
    (SELECT COUNT(*) FROM Bookings b WHERE b.VendorProfileID = v.VendorProfileID) AS BookingCount,
    (SELECT STRING_AGG(vc.Category, ', ') FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories,
    (SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1) AS PrimaryImage
FROM VendorProfiles v
JOIN Users u ON v.UserID = u.UserID
WHERE u.IsActive = 1;
GO

-- View: [dbo].[vw_VendorReviews]

-- Vendor reviews view
CREATE   VIEW vw_VendorReviews AS
SELECT 
    r.ReviewID,
    r.VendorProfileID,
    r.UserID,
    u.Name AS ReviewerName,
    u.Avatar AS ReviewerAvatar,
    r.BookingID,
    r.Rating,
    r.Title,
    r.Comment,
    r.Response,
    r.ResponseDate,
    r.IsAnonymous,
    r.IsFeatured,
    r.CreatedAt,
    (SELECT COUNT(*) FROM ReviewMedia rm WHERE rm.ReviewID = r.ReviewID) AS MediaCount,
    (SELECT TOP 1 s.Name FROM Bookings b JOIN Services s ON b.ServiceID = s.ServiceID WHERE b.BookingID = r.BookingID) AS ServiceName
FROM Reviews r
JOIN Users u ON r.UserID = u.UserID
WHERE r.IsApproved = 1;
GO

-- View: [dbo].[vw_VendorSearchResults]

-- Vendor search results view
CREATE   VIEW vw_VendorSearchResults AS
SELECT 
    v.VendorProfileID AS id,
    v.BusinessName AS name,
    v.DisplayName, -- New field
    CONCAT(v.City, ', ', v.State) AS location,
    (SELECT TOP 1 vc.Category FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS category,
    v.PriceLevel,
    (SELECT TOP 1 '$' + CAST(s.Price AS NVARCHAR(20)) FROM Services s 
     JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID 
     WHERE sc.VendorProfileID = v.VendorProfileID ORDER BY s.Price DESC) AS price,
    CAST(ISNULL((SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) + 
    ' (' + CAST(ISNULL((SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) + ')' AS rating,
    v.BusinessDescription AS description,
    ISNULL((SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1), '') AS image,
    CASE 
        WHEN v.IsPremium = 1 THEN 'Premium'
        WHEN (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) > 20 THEN 'Popular'
        ELSE NULL
    END AS badge,
    v.Capacity,
    v.Rooms,
    v.IsPremium,
    v.IsEcoFriendly,
    v.IsAwardWinning,
    v.Latitude,
    v.Longitude,
    JSON_QUERY((
        SELECT 
            sc.Name AS category,
            JSON_QUERY((
                SELECT 
                    s.ServiceID,
                    s.Name AS name,
                    s.Description AS description,
                    '$' + CAST(s.Price AS NVARCHAR(20)) + 
                    CASE WHEN s.DurationMinutes IS NOT NULL 
                         THEN ' for ' + CAST(s.DurationMinutes/60 AS NVARCHAR(10)) + ' hours'
                         ELSE '' END AS price,
                    s.DurationMinutes,
                    s.MaxAttendees
                FROM Services s
                WHERE s.CategoryID = sc.CategoryID AND s.IsActive = 1
                FOR JSON PATH
            )) AS services
        FROM ServiceCategories sc
        WHERE sc.VendorProfileID = v.VendorProfileID
        FOR JSON PATH
    )) AS services
FROM VendorProfiles v
WHERE v.IsVerified = 1;
GO

-- View: [dbo].[vw_VendorServices]

-- Vendor services view
CREATE   VIEW vw_VendorServices AS
SELECT 
    s.ServiceID,
    s.CategoryID,
    sc.VendorProfileID,  -- Changed to get from ServiceCategories
    sc.Name AS CategoryName,
    v.BusinessName AS VendorName,
    s.Name AS ServiceName,
    s.Description,
    s.Price,
    s.DurationMinutes,
    s.MinDuration,
    s.MaxAttendees,
    s.RequiresDeposit,
    s.DepositPercentage,
    s.CancellationPolicy,
    (SELECT TOP 1 si.ImageURL FROM ServiceImages si WHERE si.ServiceID = s.ServiceID AND si.IsPrimary = 1) AS PrimaryImage,
    (SELECT COUNT(*) FROM Bookings b WHERE b.ServiceID = s.ServiceID) AS BookingCount
FROM Services s
JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
JOIN VendorProfiles v ON sc.VendorProfileID = v.VendorProfileID
WHERE s.IsActive = 1;
GO

-- =============================================
-- FUNCTIONS
-- =============================================

-- =============================================
-- STORED PROCEDURES
-- =============================================

-- Procedure: [dbo].[sp_AddReview]

-- Add review procedure
CREATE   PROCEDURE sp_AddReview
    @UserID INT,
    @VendorProfileID INT,
    @BookingID INT,
    @Rating INT,
    @Title NVARCHAR(100),
    @Comment NVARCHAR(MAX),
    @IsAnonymous BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Add review
        INSERT INTO Reviews (
            UserID,
            VendorProfileID,
            BookingID,
            Rating,
            Title,
            Comment,
            IsAnonymous,
            IsApproved
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @BookingID,
            @Rating,
            @Title,
            @Comment,
            @IsAnonymous,
            1 -- Auto-approve for demo
        );
        
        DECLARE @ReviewID INT = SCOPE_IDENTITY();
        
        -- Update vendor rating
        UPDATE VendorProfiles
        SET 
            AverageResponseTime = ISNULL((
                SELECT AVG(DATEDIFF(MINUTE, m.CreatedAt, m2.CreatedAt))
                FROM Messages m
                JOIN Messages m2 ON m.ConversationID = m2.ConversationID AND m2.MessageID > m.MessageID
                JOIN Conversations c ON m.ConversationID = c.ConversationID
                WHERE c.VendorProfileID = @VendorProfileID
                AND m.SenderID != @UserID
                AND m2.SenderID = @UserID
            ), AverageResponseTime),
            ResponseRate = ISNULL((
                SELECT CAST(COUNT(DISTINCT CASE WHEN r.Response IS NOT NULL THEN r.ReviewID END) AS FLOAT) / 
                       NULLIF(COUNT(DISTINCT r.ReviewID), 0)
                FROM Reviews r
                WHERE r.VendorProfileID = @VendorProfileID
            ), ResponseRate)
        WHERE VendorProfileID = @VendorProfileID;
        
        -- Create notification for vendor
        INSERT INTO Notifications (
            UserID,
            Type,
            Title,
            Message,
            RelatedID,
            RelatedType,
            ActionURL
        )
        VALUES (
            (SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID),
            'review',
            'New Review',
            'You have received a new ' + CAST(@Rating AS NVARCHAR(10)) + ' star review',
            @ReviewID,
            'review',
            '/vendor/reviews'
        );
        
        COMMIT TRANSACTION;
        
        SELECT @ReviewID AS ReviewID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedure: [dbo].[sp_AddVendorAvailability]

-- Add availability slot with progress tracking
CREATE   PROCEDURE sp_AddVendorAvailability
    @VendorProfileID INT,
    @DayOfWeek TINYINT,
    @StartTime TIME,
    @EndTime TIME
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Use MERGE for upsert functionality
    MERGE VendorBusinessHours AS target
    USING (SELECT @VendorProfileID AS VendorProfileID, @DayOfWeek AS DayOfWeek, @StartTime AS OpenTime, @EndTime AS CloseTime) AS source
    ON target.VendorProfileID = source.VendorProfileID AND target.DayOfWeek = source.DayOfWeek
    WHEN MATCHED THEN
        UPDATE SET OpenTime = source.OpenTime, CloseTime = source.CloseTime, IsAvailable = 1
    WHEN NOT MATCHED THEN
        INSERT (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable)
        VALUES (source.VendorProfileID, source.DayOfWeek, source.OpenTime, source.CloseTime, 1);
    
    -- Update progress
    UPDATE VendorProfiles SET AvailabilityCompleted = 1, SetupStep = 4
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT 1 AS Success, 'Availability added successfully' AS Message;
END;
GO

-- Procedure: [dbo].[sp_AddVendorGalleryImage]

-- Add gallery image with enhanced support
CREATE   PROCEDURE sp_AddVendorGalleryImage
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500),
    @ImageType NVARCHAR(10),
    @Caption NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @NextDisplayOrder INT;
    SELECT @NextDisplayOrder = ISNULL(MAX(DisplayOrder), 0) + 1 
    FROM VendorImages WHERE VendorProfileID = @VendorProfileID;
    
    INSERT INTO VendorImages (VendorProfileID, ImageURL, ImageType, IsPrimary, DisplayOrder, Caption)
    VALUES (@VendorProfileID, @ImageURL, @ImageType, 0, @NextDisplayOrder, @Caption);
    
    -- Update progress
    UPDATE VendorProfiles SET GalleryCompleted = 1, SetupStep = CASE WHEN SetupStep < 2 THEN 2 ELSE SetupStep END
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT SCOPE_IDENTITY() AS ImageID, 'Gallery image added successfully' AS Message;
END;
GO

-- Procedure: [dbo].[sp_AddVendorPackage]

-- Add vendor package with enhanced features
CREATE   PROCEDURE sp_AddVendorPackage
    @VendorProfileID INT,
    @PackageName NVARCHAR(255),
    @Description NVARCHAR(MAX),
    @Price DECIMAL(10,2),
    @Duration NVARCHAR(50),
    @MaxGuests INT,
    @Includes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get or create "Packages" category
    DECLARE @CategoryID INT;
    SELECT @CategoryID = CategoryID 
    FROM ServiceCategories 
    WHERE VendorProfileID = @VendorProfileID AND Name = 'Packages';
    
    IF @CategoryID IS NULL
    BEGIN
        INSERT INTO ServiceCategories (VendorProfileID, Name, Description)
        VALUES (@VendorProfileID, 'Packages', 'Service packages offered');
        SET @CategoryID = SCOPE_IDENTITY();
    END
    
    -- Convert duration to minutes
    DECLARE @DurationMinutes INT = 60; -- Default 1 hour
    IF @Duration LIKE '%hour%'
        SET @DurationMinutes = CAST(SUBSTRING(@Duration, 1, CHARINDEX(' ', @Duration) - 1) AS INT) * 60;
    
    INSERT INTO Services (CategoryID, Name, Description, Price, DurationMinutes, MaxAttendees, ServiceType)
    VALUES (@CategoryID, @PackageName, @Description, @Price, @DurationMinutes, @MaxGuests, 'Package');
    
    -- Update progress
    UPDATE VendorProfiles SET PackagesCompleted = 1, SetupStep = CASE WHEN SetupStep < 2 THEN 2 ELSE SetupStep END
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT SCOPE_IDENTITY() AS ServiceID, 'Package added successfully' AS Message;
END;
GO

-- Procedure: [dbo].[sp_AddVendorService]

-- Add vendor service
CREATE   PROCEDURE sp_AddVendorService
    @VendorProfileID INT,
    @ServiceName NVARCHAR(255),
    @Description NVARCHAR(MAX),
    @Price DECIMAL(10,2),
    @Duration NVARCHAR(50),
    @Category NVARCHAR(100) = 'General Services'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get or create service category
    DECLARE @CategoryID INT;
    SELECT @CategoryID = CategoryID 
    FROM ServiceCategories 
    WHERE VendorProfileID = @VendorProfileID AND Name = @Category;
    
    IF @CategoryID IS NULL
    BEGIN
        INSERT INTO ServiceCategories (VendorProfileID, Name, Description)
        VALUES (@VendorProfileID, @Category, @Category + ' offered by vendor');
        SET @CategoryID = SCOPE_IDENTITY();
    END
    
    -- Convert duration to minutes
    DECLARE @DurationMinutes INT = 60; -- Default 1 hour
    IF @Duration LIKE '%hour%'
        SET @DurationMinutes = CAST(SUBSTRING(@Duration, 1, CHARINDEX(' ', @Duration) - 1) AS INT) * 60;
    
    INSERT INTO Services (CategoryID, Name, Description, Price, DurationMinutes, ServiceType)
    VALUES (@CategoryID, @ServiceName, @Description, @Price, @DurationMinutes, 'Service');
    
    -- Update progress
    UPDATE VendorProfiles SET ServicesCompleted = 1, SetupStep = CASE WHEN SetupStep < 2 THEN 2 ELSE SetupStep END
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT SCOPE_IDENTITY() AS ServiceID, 'Service added successfully' AS Message;
END;
GO

-- Procedure: [dbo].[sp_AddVendorSocialMedia]

-- Add social media link with progress tracking
CREATE   PROCEDURE sp_AddVendorSocialMedia
    @VendorProfileID INT,
    @Platform NVARCHAR(50),
    @URL NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Use MERGE for upsert functionality
    MERGE VendorSocialMedia AS target
    USING (SELECT @VendorProfileID AS VendorProfileID, @Platform AS Platform, @URL AS URL) AS source
    ON target.VendorProfileID = source.VendorProfileID AND target.Platform = source.Platform
    WHEN MATCHED THEN
        UPDATE SET URL = source.URL
    WHEN NOT MATCHED THEN
        INSERT (VendorProfileID, Platform, URL, DisplayOrder)
        VALUES (source.VendorProfileID, source.Platform, source.URL, 
                (SELECT ISNULL(MAX(DisplayOrder), 0) + 1 FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID));
    
    -- Update progress
    UPDATE VendorProfiles SET SocialMediaCompleted = 1, SetupStep = CASE WHEN SetupStep < 3 THEN 3 ELSE SetupStep END
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT 1 AS Success, 'Social media link added successfully' AS Message;
END;
GO

-- Procedure: [dbo].[sp_CompleteVendorSetup]

-- Complete vendor setup with all features
CREATE   PROCEDURE sp_CompleteVendorSetup
    @VendorProfileID INT,
    @GalleryData NVARCHAR(MAX) = NULL,
    @PackagesData NVARCHAR(MAX) = NULL,
    @ServicesData NVARCHAR(MAX) = NULL,
    @SocialMediaData NVARCHAR(MAX) = NULL,
    @AvailabilityData NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Save gallery images using VendorImages table
        IF @GalleryData IS NOT NULL
        BEGIN
            -- Clear existing non-primary images
            DELETE FROM VendorImages WHERE VendorProfileID = @VendorProfileID AND IsPrimary = 0;
            
            -- Insert new gallery items
            INSERT INTO VendorImages (VendorProfileID, ImageURL, ImageType, IsPrimary, DisplayOrder, Caption)
            SELECT 
                @VendorProfileID,
                JSON_VALUE(value, '$.url'),
                JSON_VALUE(value, '$.type'),
                CASE WHEN ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) = 1 THEN 1 ELSE 0 END,
                ROW_NUMBER() OVER (ORDER BY (SELECT NULL)),
                JSON_VALUE(value, '$.caption')
            FROM OPENJSON(@GalleryData);
            
            -- Mark gallery as completed
            UPDATE VendorProfiles SET GalleryCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        END
        
        -- Save packages using Services table with a "Packages" category
        IF @PackagesData IS NOT NULL
        BEGIN
            -- Get or create a "Packages" service category
            DECLARE @PackageCategoryID INT;
            SELECT @PackageCategoryID = CategoryID 
            FROM ServiceCategories 
            WHERE VendorProfileID = @VendorProfileID AND Name = 'Packages';
            
            IF @PackageCategoryID IS NULL
            BEGIN
                INSERT INTO ServiceCategories (VendorProfileID, Name, Description)
                VALUES (@VendorProfileID, 'Packages', 'Service packages offered');
                SET @PackageCategoryID = SCOPE_IDENTITY();
            END
            
            -- Clear existing packages
            DELETE FROM Services WHERE CategoryID = @PackageCategoryID;
            
            -- Insert new packages as services
            INSERT INTO Services (CategoryID, Name, Description, Price, DurationMinutes, MaxAttendees, ServiceType)
            SELECT 
                @PackageCategoryID,
                JSON_VALUE(value, '$.name'),
                JSON_VALUE(value, '$.description'),
                CAST(JSON_VALUE(value, '$.price') AS DECIMAL(10,2)),
                CASE 
                    WHEN JSON_VALUE(value, '$.duration') LIKE '%hour%' 
                    THEN CAST(SUBSTRING(JSON_VALUE(value, '$.duration'), 1, CHARINDEX(' ', JSON_VALUE(value, '$.duration')) - 1) AS INT) * 60
                    ELSE 60
                END,
                CAST(JSON_VALUE(value, '$.maxGuests') AS INT),
                'Package'
            FROM OPENJSON(@PackagesData);
            
            -- Mark packages as completed
            UPDATE VendorProfiles SET PackagesCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        END
        
        -- Save services using Services table with "General Services" category
        IF @ServicesData IS NOT NULL
        BEGIN
            -- Get or create a "General Services" category
            DECLARE @ServicesCategoryID INT;
            SELECT @ServicesCategoryID = CategoryID 
            FROM ServiceCategories 
            WHERE VendorProfileID = @VendorProfileID AND Name = 'General Services';
            
            IF @ServicesCategoryID IS NULL
            BEGIN
                INSERT INTO ServiceCategories (VendorProfileID, Name, Description)
                VALUES (@VendorProfileID, 'General Services', 'General services offered');
                SET @ServicesCategoryID = SCOPE_IDENTITY();
            END
            
            -- Insert services
            INSERT INTO Servi
GO

-- Procedure: [dbo].[sp_ConfirmBookingPayment]

-- Confirm booking payment
CREATE   PROCEDURE sp_ConfirmBookingPayment
    @BookingID INT,
    @PaymentIntentID NVARCHAR(100),
    @Amount DECIMAL(10, 2),
    @FeeAmount DECIMAL(10, 2) = 0,
    @ChargeID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Update booking payment status
        DECLARE @IsDeposit BIT = CASE 
            WHEN @Amount < (SELECT TotalAmount FROM Bookings WHERE BookingID = @BookingID) 
            THEN 1 ELSE 0 END;
        
        IF @IsDeposit = 1
        BEGIN
            UPDATE Bookings
            SET DepositPaid = 1
            WHERE BookingID = @BookingID;
        END
        ELSE
        BEGIN
            UPDATE Bookings
            SET FullAmountPaid = 1
            WHERE BookingID = @BookingID;
        END
        
        -- Record transaction
        DECLARE @UserID INT = (SELECT UserID FROM Bookings WHERE BookingID = @BookingID);
        DECLARE @VendorProfileID INT = (SELECT VendorProfileID FROM Bookings WHERE BookingID = @BookingID);
        
        INSERT INTO Transactions (
            UserID,
            VendorProfileID,
            BookingID,
            Amount,
            FeeAmount,
            NetAmount,
            Currency,
            Description,
            StripeChargeID,
            Status
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @BookingID,
            @Amount,
            @FeeAmount,
            @Amount - @FeeAmount,
            'USD',
            CASE WHEN @IsDeposit = 1 THEN 'Deposit payment' ELSE 'Full payment' END,
            @ChargeID,
            'succeeded'
        );
        
        -- Create notification
        IF @IsDeposit = 1
        BEGIN
            INSERT INTO Notifications (
                UserID,
                Type,
                Title,
                Message,
                RelatedID,
                RelatedType,
                ActionURL
            )
            VALUES (
                (SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID),
                'payment',
                'Deposit Received',
                'A deposit payment has been received for booking #' + CAST(@BookingID AS NVARCHAR(10)),
                @BookingID,
                'booking',
                '/vendor/bookings/' + CAST(@BookingID AS NVARCHAR(10))
            );
        END
        ELSE
        BEGIN
            INSERT INTO Notifications (
                UserID,
                Type,
                Title,
                Message,
                RelatedID,
                RelatedType,
                ActionURL
            )
            VALUES (
                (SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID),
                'payment',
                'Payment Received',
                'Full payment has been received for booking #' + CAST(@BookingID AS NVARCHAR(10)),
                @BookingID,
                'booking',
                '/vendor/bookings/' + CAST(@BookingID AS NVARCHAR(10))
            );
        END
        
        COMMIT TRANSACTION;
        
        SELECT 1 AS Success;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedure: [dbo].[sp_CreateBooking]

-- Create booking procedure (single service)
CREATE   PROCEDURE sp_CreateBooking
    @UserID INT,
    @ServiceID INT,
    @EventDate DATETIME,
    @EndDate DATETIME,
    @AttendeeCount INT = 1,
    @SpecialRequests NVARCHAR(MAX) = NULL,
    @PaymentIntentID NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @VendorProfileID INT;
        DECLARE @ServicePrice DECIMAL(10, 2);
        DECLARE @DepositPercentage DECIMAL(5, 2);
        DECLARE @DepositAmount DECIMAL(10, 2);
        DECLARE @TotalAmount DECIMAL(10, 2);
        
        -- Get service details
        SELECT 
            @VendorProfileID = sc.VendorProfileID,
            @ServicePrice = s.Price,
            @DepositPercentage = s.DepositPercentage
        FROM Services s
        JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
        WHERE s.ServiceID = @ServiceID;
        
        -- Calculate amounts
        SET @TotalAmount = @ServicePrice;
        SET @DepositAmount = @TotalAmount * (@DepositPercentage / 100);
        
        -- Create booking
        INSERT INTO Bookings (
            UserID,
            VendorProfileID,
            ServiceID,
            EventDate,
            EndDate,
            Status,
            TotalAmount,
            DepositAmount,
            AttendeeCount,
            SpecialRequests,
            StripePaymentIntentID
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @ServiceID,
            @EventDate,
            @EndDate,
            'pending',
            @TotalAmount,
            @DepositAmount,
            @AttendeeCount,
            @SpecialRequests,
            @PaymentIntentID
        );
        
        DECLARE @BookingID INT = SCOPE_IDENTITY();
        
        -- Add booking service
        INSERT INTO BookingServices (
            BookingID,
            ServiceID,
            PriceAtBooking
        )
        VALUES (
            @BookingID,
            @ServiceID,
            @ServicePrice
        );
        
        -- Create booking timeline entry
        INSERT INTO BookingTimeline (
            BookingID,
            Status,
            ChangedBy,
            Notes
        )
        VALUES (
            @BookingID,
            'pending',
            @UserID,
            'Booking created by customer'
        );
        
        -- Create conversation
        DECLARE @ConversationID INT;
        
        INSERT INTO Conversations (
            UserID,
            VendorProfileID,
            BookingID,
            Subject,
            LastMessageAt
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @BookingID,
            'Booking #' + CAST(@BookingID AS NVARCHAR(10)),
            GETDATE()
        );
        
        SET @ConversationID = SCOPE_IDENTITY();
        
        -- Create initial message
        INSERT INTO Messages (
            ConversationID,
            SenderID,
            Content
        )
        VALUES (
            @ConversationID,
            @UserID,
            'I have booked your service for ' + CONVERT(NVARCHAR(20), @EventDate, 107) + '. ' + 
            ISNULL(@SpecialRequests, 'No special requests.')
        );
        
        -- Create notification for vendor
        INSERT INTO Notifications (
            UserID,
            Type,
            Title,
            Message,
            RelatedID,
            RelatedType,
            ActionURL
        )
        VALUES (
            (SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID),
            'booking',
            'New Booking Request',
            'You have a new booking request for ' + CONVERT(NVARCHAR(20), @EventDate, 107),
            @BookingID,
            'booking',
            '/vendor/bookings/' + CAST(@BookingID AS NVARCHAR(10))
        );
        
        COMMIT TRANSACTION;
        
        SELECT @BookingID AS BookingID, @ConversationID AS Conver
GO

-- Procedure: [dbo].[sp_CreateBookingPaymentIntent]

-- Create payment intent for booking
CREATE   PROCEDURE sp_CreateBookingPaymentIntent
    @BookingID INT,
    @Amount DECIMAL(10, 2),
    @Currency NVARCHAR(3) = 'USD',
    @PaymentMethodID NVARCHAR(100) = NULL,
    @CustomerID NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PaymentIntentID NVARCHAR(100) = 'pi_' + LEFT(NEWID(), 8) + '_' + LEFT(NEWID(), 8);
    DECLARE @ClientSecret NVARCHAR(100) = 'secret_' + LEFT(NEWID(), 24);
    
    -- In a real implementation, this would call Stripe API to create a payment intent
    -- This is a simplified version for demo purposes
    
    -- Update booking with payment intent
    UPDATE Bookings
    SET StripePaymentIntentID = @PaymentIntentID
    WHERE BookingID = @BookingID;
    
    SELECT 
        @PaymentIntentID AS PaymentIntentID,
        @ClientSecret AS ClientSecret;
END;
GO

-- Procedure: [dbo].[sp_CreateBookingWithServices]

-- Create booking with multiple services
CREATE   PROCEDURE sp_CreateBookingWithServices
    @UserID INT,
    @VendorProfileID INT,
    @EventDate DATETIME,
    @EndDate DATETIME,
    @AttendeeCount INT = 1,
    @SpecialRequests NVARCHAR(MAX) = NULL,
    @PaymentIntentID NVARCHAR(100) = NULL,
    @ServicesJSON NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @TotalAmount DECIMAL(10, 2) = 0;
        DECLARE @DepositAmount DECIMAL(10, 2) = 0;
        DECLARE @MaxDepositPercentage DECIMAL(5, 2) = 0;
        
        -- Parse services JSON
        DECLARE @Services TABLE (
            ServiceID INT,
            AddOnID INT NULL,
            Quantity INT,
            Price DECIMAL(10, 2),
            DepositPercentage DECIMAL(5, 2)
        );
        
        INSERT INTO @Services
        SELECT 
            ServiceID,
            AddOnID,
            Quantity,
            Price,
            DepositPercentage
        FROM OPENJSON(@ServicesJSON)
        WITH (
            ServiceID INT '$.serviceId',
            AddOnID INT '$.addOnId',
            Quantity INT '$.quantity',
            Price DECIMAL(10, 2) '$.price',
            DepositPercentage DECIMAL(5, 2) '$.depositPercentage'
        );
        
        -- Calculate totals
        SELECT 
            @TotalAmount = SUM(Price * Quantity),
            @MaxDepositPercentage = MAX(DepositPercentage)
        FROM @Services;
        
        SET @DepositAmount = @TotalAmount * (@MaxDepositPercentage / 100);
        
        -- Create booking
        INSERT INTO Bookings (
            UserID,
            VendorProfileID,
            EventDate,
            EndDate,
            Status,
            TotalAmount,
            DepositAmount,
            AttendeeCount,
            SpecialRequests,
            StripePaymentIntentID
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @EventDate,
            @EndDate,
            'pending',
            @TotalAmount,
            @DepositAmount,
            @AttendeeCount,
            @SpecialRequests,
            @PaymentIntentID
        );
        
        DECLARE @BookingID INT = SCOPE_IDENTITY();
        
        -- Add booking services
        INSERT INTO BookingServices (
            BookingID,
            ServiceID,
            AddOnID,
            Quantity,
            PriceAtBooking,
            Notes
        )
        SELECT 
            @BookingID,
            ServiceID,
            AddOnID,
            Quantity,
            Price,
            'Booked via website'
        FROM @Services;
        
        -- Create booking timeline entry
        INSERT INTO BookingTimeline (
            BookingID,
            Status,
            ChangedBy,
            Notes
        )
        VALUES (
            @BookingID,
            'pending',
            @UserID,
            'Booking created by customer'
        );
        
        -- Create conversation
        DECLARE @ConversationID INT;
        
        INSERT INTO Conversations (
            UserID,
            VendorProfileID,
            BookingID,
            Subject,
            LastMessageAt
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @BookingID,
            'Booking #' + CAST(@BookingID AS NVARCHAR(10)),
            GETDATE()
        );
        
        SET @ConversationID = SCOPE_IDENTITY();
        
        -- Create initial message
        INSERT INTO Messages (
            ConversationID,
            SenderID,
            Content
        )
        VALUES (
            @ConversationID,
            @UserID,
            'I have booked services for ' + CONVERT(NVARCHAR(20), @EventDate, 107) + '. ' + 
            ISNULL(@SpecialRequests, 'No special requests.')
        );
        
        -- Create notification for vendor
        INSERT INTO Notifications (
            UserID,
            Type,
            Title,
            Message,
GO

-- Procedure: [dbo].[sp_CreateConversation]

--Creates Conversation , and handles creating conversation for booking
CREATE   PROCEDURE sp_CreateConversation
    @UserID INT,
    @VendorProfileID INT,
    @BookingID INT = NULL,
    @Subject NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validate participants
        IF NOT EXISTS (SELECT 1 FROM Users WHERE UserID = @UserID AND IsActive = 1)
        BEGIN
            RAISERROR('User not found or inactive', 16, 1);
            RETURN;
        END
        
        IF NOT EXISTS (SELECT 1 FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID AND IsVerified = 1)
        BEGIN
            RAISERROR('Vendor not found or not verified', 16, 1);
            RETURN;
        END
        
        -- Validate booking if provided
        IF @BookingID IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM Bookings 
                WHERE BookingID = @BookingID 
                AND (UserID = @UserID OR VendorProfileID = @VendorProfileID)
            )
            BEGIN
                RAISERROR('Booking not found or not associated with these participants', 16, 1);
                RETURN;
            END
        END
        
        -- Set default subject if not provided
        IF @Subject IS NULL
        BEGIN
            SET @Subject = CASE 
                WHEN @BookingID IS NOT NULL THEN 'Booking #' + CAST(@BookingID AS NVARCHAR(10))
                ELSE 'New Conversation'
            END;
        END
        
        -- Create conversation
        INSERT INTO Conversations (
            UserID,
            VendorProfileID,
            BookingID,
            Subject,
            LastMessageAt
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @BookingID,
            @Subject,
            GETDATE()
        );
        
        DECLARE @ConversationID INT = SCOPE_IDENTITY();
        
        -- Return conversation details
        SELECT 
            c.ConversationID,
            c.UserID,
            u.Name AS UserName,
            u.Avatar AS UserAvatar,
            c.VendorProfileID,
            v.BusinessName AS VendorName,
            (SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1) AS VendorImage,
            c.BookingID,
            b.ServiceID,
            s.Name AS ServiceName,
            c.Subject,
            c.LastMessageAt,
            c.CreatedAt
        FROM Conversations c
        JOIN Users u ON c.UserID = u.UserID
        JOIN VendorProfiles v ON c.VendorProfileID = v.VendorProfileID
        LEFT JOIN Bookings b ON c.BookingID = b.BookingID
        LEFT JOIN Services s ON b.ServiceID = s.ServiceID
        WHERE c.ConversationID = @ConversationID;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedure: [dbo].[sp_DeleteVendorAvailabilityException]

-- NEW: Delete Vendor Availability Exception
CREATE   PROCEDURE sp_DeleteVendorAvailabilityException
    @ExceptionID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM VendorAvailabilityExceptions WHERE ExceptionID = @ExceptionID AND VendorProfileID = @VendorProfileID)
    BEGIN
        DELETE FROM VendorAvailabilityExceptions WHERE ExceptionID = @ExceptionID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Availability exception not found or does not belong to this vendor.', 16, 1);
        SELECT 0 AS Success;
    END
END;
GO

-- Procedure: [dbo].[sp_DeleteVendorBusinessHour]

-- NEW: Delete Vendor Business Hour
CREATE   PROCEDURE sp_DeleteVendorBusinessHour
    @HoursID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM VendorBusinessHours WHERE HoursID = @HoursID AND VendorProfileID = @VendorProfileID)
    BEGIN
        DELETE FROM VendorBusinessHours WHERE HoursID = @HoursID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Business hour entry not found or does not belong to this vendor.', 16, 1);
        SELECT 0 AS Success;
    END
END;
GO

-- Procedure: [dbo].[sp_DeleteVendorImage]

-- NEW: Delete Vendor Image
CREATE   PROCEDURE sp_DeleteVendorImage
    @ImageID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM VendorImages WHERE ImageID = @ImageID AND VendorProfileID = @VendorProfileID)
    BEGIN
        DELETE FROM VendorImages WHERE ImageID = @ImageID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Image not found or does not belong to this vendor.', 16, 1);
        SELECT 0 AS Success;
    END
END;
GO

-- Procedure: [dbo].[sp_DeleteVendorService]

-- NEW: Delete Vendor Service
CREATE   PROCEDURE sp_DeleteVendorService
    @ServiceID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Ensure the service belongs to the vendor
    IF EXISTS (
        SELECT 1 
        FROM Services s
        JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
        WHERE s.ServiceID = @ServiceID AND sc.VendorProfileID = @VendorProfileID
    )
    BEGIN
        -- Optionally, check for active bookings before deleting
        IF EXISTS (SELECT 1 FROM Bookings WHERE ServiceID = @ServiceID AND Status NOT IN ('cancelled', 'completed'))
        BEGIN
            RAISERROR('Cannot delete service with active bookings. Please cancel or complete bookings first.', 16, 1);
            RETURN;
        END

        DELETE FROM Services WHERE ServiceID = @ServiceID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Service not found or does not belong to this vendor.', 16, 1);
        SELECT 0 AS Success;
    END
END;
GO

-- Procedure: [dbo].[sp_GetBookingDetails]

-- Get booking details
CREATE   PROCEDURE sp_GetBookingDetails
    @BookingID INT,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Booking info
    SELECT 
        b.BookingID,
        b.UserID,
        u.Name AS UserName,
        u.Email AS UserEmail,
        u.Phone AS UserPhone,
        b.VendorProfileID,
        v.BusinessName AS VendorName,
        v.BusinessEmail AS VendorEmail,
        v.BusinessPhone AS VendorPhone,
        b.EventDate,
        b.EndDate,
        b.Status,
        b.TotalAmount,
        b.DepositAmount,
        b.DepositPaid,
        b.FullAmountPaid,
        b.AttendeeCount,
        b.SpecialRequests,
        b.StripePaymentIntentID,
        b.CreatedAt,
        b.UpdatedAt,
        CASE 
            WHEN b.UserID = @UserID THEN 1
            WHEN v.UserID = @UserID THEN 1
            ELSE 0
        END AS CanViewDetails
    FROM Bookings b
    JOIN Users u ON b.UserID = u.UserID
    JOIN VendorProfiles v ON b.VendorProfileID = v.VendorProfileID
    WHERE b.BookingID = @BookingID
    AND (@UserID IS NULL OR b.UserID = @UserID OR v.UserID = @UserID);
    
    -- Booking services
    SELECT 
        bs.BookingServiceID,
        bs.ServiceID,
        s.Name AS ServiceName,
        bs.AddOnID,
        sa.Name AS AddOnName,
        bs.Quantity,
        bs.PriceAtBooking,
        bs.Notes,
        (SELECT TOP 1 si.ImageURL FROM ServiceImages si WHERE si.ServiceID = s.ServiceID AND si.IsPrimary = 1) AS ServiceImage
    FROM BookingServices bs
    LEFT JOIN Services s ON bs.ServiceID = s.ServiceID
    LEFT JOIN ServiceAddOns sa ON bs.AddOnID = sa.AddOnID
    WHERE bs.BookingID = @BookingID;
    
    -- Booking timeline
    SELECT 
        bt.TimelineID,
        bt.Status,
        bt.ChangedBy,
        u.Name AS ChangedByName,
        bt.Notes,
        bt.CreatedAt
    FROM BookingTimeline bt
    LEFT JOIN Users u ON bt.ChangedBy = u.UserID
    WHERE bt.BookingID = @BookingID
    ORDER BY bt.CreatedAt DESC;
    
    -- Conversation info if exists
    SELECT TOP 1
        c.ConversationID
    FROM Conversations c
    WHERE c.BookingID = @BookingID;
END;
GO

-- Procedure: [dbo].[sp_GetConversationMessages]


    
-- Get conversation messages
CREATE   PROCEDURE sp_GetConversationMessages
    @ConversationID INT,
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verify user has access to conversation
    IF EXISTS (
        SELECT 1 FROM Conversations c
        WHERE c.ConversationID = @ConversationID
        AND (c.UserID = @UserID OR 
             (SELECT v.UserID FROM VendorProfiles v WHERE v.VendorProfileID = c.VendorProfileID) = @UserID)
    )
    BEGIN
        -- Get messages
        SELECT 
            m.MessageID,
            m.SenderID,
            u.Name AS SenderName,
            u.Avatar AS SenderAvatar,
            m.Content,
            m.IsRead,
            m.ReadAt,
            m.CreatedAt,
            (
                SELECT 
                    ma.AttachmentID,
                    ma.FileURL,
                    ma.FileType,
                    ma.FileSize,
                    ma.OriginalName
                FROM MessageAttachments ma
                WHERE ma.MessageID = m.MessageID
                FOR JSON PATH
            ) AS Attachments
        FROM Messages m
        JOIN Users u ON m.SenderID = u.UserID
        WHERE m.ConversationID = @ConversationID
        ORDER BY m.CreatedAt;
        
        -- Mark messages as read if recipient
        UPDATE m
        SET m.IsRead = 1,
            m.ReadAt = GETDATE()
        FROM Messages m
        JOIN Conversations c ON m.ConversationID = c.ConversationID
        WHERE m.ConversationID = @ConversationID
        AND m.SenderID != @UserID
        AND m.IsRead = 0;
    END
    ELSE
    BEGIN
        -- Return empty result if no access
        SELECT TOP 0 NULL AS MessageID;
    END
END;
GO

-- Procedure: [dbo].[sp_GetNearbyVendors]

-- Get nearby vendors
CREATE   PROCEDURE sp_GetNearbyVendors
    @Latitude DECIMAL(10, 8),
    @Longitude DECIMAL(11, 8),
    @RadiusMiles INT = 25,
    @Category NVARCHAR(50) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        v.VendorProfileID AS id,
        v.BusinessName AS name,
        CONCAT(v.City, ', ', v.State) AS location,
        (SELECT TOP 1 vc.Category FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS category,
        v.PriceLevel,
        (SELECT TOP 1 '$' + CAST(s.Price AS NVARCHAR(20)) FROM Services s 
         JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID 
         WHERE sc.VendorProfileID = v.VendorProfileID ORDER BY s.Price DESC) AS price,
        CAST(ISNULL((SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) + 
        ' (' + CAST(ISNULL((SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) + ')' AS rating,
        v.BusinessDescription AS description,
        ISNULL((SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1), '') AS image,
        CASE 
            WHEN v.IsPremium = 1 THEN 'Premium'
            WHEN (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) > 20 THEN 'Popular'
            ELSE NULL
        END AS badge,
        3959 * ACOS(
            COS(RADIANS(@Latitude)) * COS(RADIANS(v.Latitude)) * COS(RADIANS(v.Longitude) - RADIANS(@Longitude)) + 
            SIN(RADIANS(@Latitude)) * SIN(RADIANS(v.Latitude))
        ) AS DistanceMiles
    FROM VendorProfiles v
    WHERE v.Latitude IS NOT NULL AND v.Longitude IS NOT NULL
    AND 3959 * ACOS(
        COS(RADIANS(@Latitude)) * COS(RADIANS(v.Latitude)) * COS(RADIANS(v.Longitude) - RADIANS(@Longitude)) + 
        SIN(RADIANS(@Latitude)) * SIN(RADIANS(v.Latitude))
    ) <= @RadiusMiles
    AND (@Category IS NULL OR EXISTS (
        SELECT 1 FROM VendorCategories vc 
        WHERE vc.VendorProfileID = v.VendorProfileID 
        AND vc.Category = @Category
    ))
    ORDER BY DistanceMiles;
END;
GO

-- Procedure: [dbo].[sp_GetServiceAvailability]

CREATE   PROCEDURE sp_GetServiceAvailability
    @ServiceID INT,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get service details
    SELECT 
        s.ServiceID,
        s.Name,
        s.DurationMinutes,
        sc.Name AS CategoryName,
        vp.BusinessName AS VendorName,
        vp.VendorProfileID
    FROM Services s
    JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
    JOIN VendorProfiles vp ON sc.VendorProfileID = vp.VendorProfileID
    WHERE s.ServiceID = @ServiceID;
    
    -- Get standard business hours
    SELECT 
        DayOfWeek,
        OpenTime,
        CloseTime,
        IsAvailable
    FROM VendorBusinessHours
    WHERE VendorProfileID = (
        SELECT sc.VendorProfileID 
        FROM Services s
        JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
        WHERE s.ServiceID = @ServiceID
    )
    ORDER BY DayOfWeek;
    
    -- Get availability exceptions
    SELECT 
        StartDateTime,
        EndDateTime,
        IsAvailable,
        Reason
    FROM ServiceAvailability
    WHERE ServiceID = @ServiceID
    AND (
        (StartDateTime >= @StartDate AND StartDateTime <= @EndDate) OR
        (EndDateTime >= @StartDate AND EndDateTime <= @EndDate) OR
        (StartDateTime <= @StartDate AND EndDateTime >= @EndDate)
    )
    ORDER BY StartDateTime;
    
    -- Get existing bookings
    SELECT 
        EventDate,
        EndDate,
        Status
    FROM Bookings
    WHERE ServiceID = @ServiceID
    AND Status NOT IN ('cancelled', 'rejected')
    AND (
        (EventDate >= @StartDate AND EventDate <= @EndDate) OR
        (EndDate >= @StartDate AND EndDate <= @EndDate) OR
        (EventDate <= @StartDate AND EndDate >= @EndDate)
    )
    ORDER BY EventDate;
    
    -- Get available time slots (simplified date calculation)
    SELECT 
        ts.SlotID,
        ts.DayOfWeek,
        ts.Date,
        ts.StartTime,
        ts.EndTime,
        ts.MaxCapacity,
        (SELECT COUNT(*) FROM Bookings b 
         WHERE b.ServiceID = @ServiceID 
         AND b.Status NOT IN ('cancelled', 'rejected')
         AND (
             (ts.Date IS NOT NULL AND CONVERT(DATE, b.EventDate) = ts.Date)
             OR
             (ts.Date IS NULL AND DATEPART(WEEKDAY, b.EventDate) = ts.DayOfWeek + 1)
         )
         AND CONVERT(TIME, b.EventDate) BETWEEN ts.StartTime AND ts.EndTime
        ) AS BookedCount
    FROM TimeSlots ts
    WHERE ts.ServiceID = @ServiceID
    AND ts.IsAvailable = 1
    AND (
        (ts.Date IS NULL) OR -- Recurring weekly slots
        (ts.Date BETWEEN @StartDate AND @EndDate) -- Specific date slots
    )
    ORDER BY 
        CASE WHEN ts.Date IS NULL THEN DATEADD(DAY, ts.DayOfWeek - DATEPART(WEEKDAY, @StartDate) + 7, @StartDate)
             ELSE ts.Date
        END,
        ts.StartTime;
END;
GO

-- Procedure: [dbo].[sp_GetUserBookingsAll]

-- NEW: Get all bookings for a specific user
CREATE   PROCEDURE sp_GetUserBookingsAll
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT *
    FROM vw_UserBookings
    WHERE UserID = @UserID
    ORDER BY EventDate DESC;
END;
GO

-- Procedure: [dbo].[sp_GetUserDashboard]

-- Get user dashboard data
CREATE   PROCEDURE sp_GetUserDashboard
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- User info
    SELECT 
        UserID,
        Name,
        Email,
        Avatar,
        Phone,
        IsVendor
    FROM Users
    WHERE UserID = @UserID;
    
    -- Upcoming bookings
    SELECT TOP 5 *
    FROM vw_UserBookings
    WHERE UserID = @UserID
    AND EventDate >= GETDATE()
    AND Status NOT IN ('cancelled', 'rejected')
    ORDER BY EventDate;
    
    -- Recent favorites
    SELECT TOP 5 *
    FROM vw_UserFavorites
    WHERE UserID = @UserID
    ORDER BY CreatedAt DESC;
    
    -- Unread messages
    SELECT COUNT(*) AS UnreadMessages
    FROM vw_UserConversations
    WHERE UserID = @UserID
    AND UnreadCount > 0;
    
    -- Unread notifications
    SELECT COUNT(*) AS UnreadNotifications
    FROM Notifications
    WHERE UserID = @UserID
    AND IsRead = 0;
END;
GO

-- Procedure: [dbo].[sp_GetUserFavorites]

-- Corrected stored procedure for user favorites

CREATE   PROCEDURE sp_GetUserFavorites
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_UserFavorites
    WHERE UserID = @UserID
    ORDER BY CreatedAt DESC;
END;
GO

-- Procedure: [dbo].[sp_GetUserNotifications]

-- Get user notifications
CREATE   PROCEDURE sp_GetUserNotifications
    @UserID INT,
    @UnreadOnly BIT = 0,
    @Limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        n.NotificationID,
        n.Type,
        n.Title,
        n.Message,
        n.IsRead,
        n.ReadAt,
        n.RelatedID,
        n.RelatedType,
        n.ActionURL,
        n.CreatedAt,
        CASE 
            WHEN n.Type = 'booking' THEN (SELECT b.Status FROM Bookings b WHERE b.BookingID = n.RelatedID)
            ELSE NULL
        END AS Status
    FROM Notifications n
    WHERE n.UserID = @UserID
    AND (@UnreadOnly = 0 OR n.IsRead = 0)
    ORDER BY n.CreatedAt DESC;
    
    -- Mark as read if fetching unread
    IF @UnreadOnly = 1
    BEGIN
        UPDATE Notifications
        SET IsRead = 1,
            ReadAt = GETDATE()
        WHERE UserID = @UserID
        AND IsRead = 0;
    END
END;
GO

-- Procedure: [dbo].[sp_GetUserProfileDetails]

-- NEW: Get full user profile details for settings
CREATE   PROCEDURE sp_GetUserProfileDetails
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        UserID,
        Name,
        Email,
        Phone,
        Bio,
        Avatar,
        IsVendor
    FROM Users
    WHERE UserID = @UserID;
END;
GO

-- Procedure: [dbo].[sp_GetUserReviews]

-- NEW: Get all reviews made by a specific user
CREATE   PROCEDURE sp_GetUserReviews
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.ReviewID,
        r.VendorProfileID,
        vp.BusinessName AS VendorName,
        r.BookingID,
        r.Rating,
        r.Title,
        r.Comment,
        r.CreatedAt,
        (SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = vp.VendorProfileID AND vi.IsPrimary = 1) AS VendorImage
    FROM Reviews r
    JOIN VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
    WHERE r.UserID = @UserID
    ORDER BY r.CreatedAt DESC;
END;
GO

-- Procedure: [dbo].[sp_GetVendorAnalytics]

-- Corrected stored procedure for vendor analytics using actual tables

CREATE   PROCEDURE sp_GetVendorAnalytics
    @VendorProfileID INT,
    @StartDate DATE = NULL,
    @EndDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @StartDate IS NULL SET @StartDate = DATEADD(DAY, -30, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();

    -- Booking stats
    SELECT 
        COUNT(*) AS TotalBookings,
        SUM(CASE WHEN Status = 'completed' THEN 1 ELSE 0 END) AS CompletedBookings,
        SUM(CASE WHEN Status = 'confirmed' THEN 1 ELSE 0 END) AS ConfirmedBookings,
        SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) AS PendingBookings,
        SUM(CASE WHEN Status = 'cancelled' THEN 1 ELSE 0 END) AS CancelledBookings,
        SUM(TotalAmount) AS TotalRevenue,
        AVG(TotalAmount) AS AverageBookingValue
    FROM Bookings
    WHERE VendorProfileID = @VendorProfileID
    AND EventDate BETWEEN @StartDate AND @EndDate;

    -- Revenue by service
    SELECT 
        s.Name AS ServiceName,
        COUNT(*) AS BookingCount,
        SUM(bs.PriceAtBooking * bs.Quantity) AS TotalRevenue
    FROM Bookings b
    JOIN BookingServices bs ON b.BookingID = bs.BookingID
    JOIN Services s ON bs.ServiceID = s.ServiceID
    WHERE b.VendorProfileID = @VendorProfileID
    AND b.EventDate BETWEEN @StartDate AND @EndDate
    GROUP BY s.Name
    ORDER BY TotalRevenue DESC;

    -- Revenue by month
    SELECT 
        YEAR(EventDate) AS Year,
        MONTH(EventDate) AS Month,
        COUNT(*) AS BookingCount,
        SUM(TotalAmount) AS TotalRevenue
    FROM Bookings
    WHERE VendorProfileID = @VendorProfileID
    AND EventDate BETWEEN @StartDate AND @EndDate
    GROUP BY YEAR(EventDate), MONTH(EventDate)
    ORDER BY Year, Month;

    -- Review stats
    SELECT 
        AVG(CAST(Rating AS DECIMAL(3,1))) AS AverageRating,
        COUNT(*) AS ReviewCount,
        SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END) AS FiveStarReviews,
        SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END) AS FourStarReviews,
        SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END) AS ThreeStarReviews,
        SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END) AS TwoStarReviews,
        SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END) AS OneStarReviews
    FROM Reviews
    WHERE VendorProfileID = @VendorProfileID
    AND CreatedAt BETWEEN @StartDate AND @EndDate;
END;
GO

-- Procedure: [dbo].[sp_GetVendorAvailability]

-- NEW: Get vendor availability (business hours and exceptions)
CREATE   PROCEDURE sp_GetVendorAvailability
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Business Hours
    SELECT 
        HoursID,
        DayOfWeek,
        OpenTime,
        CloseTime,
        IsAvailable
    FROM VendorBusinessHours
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DayOfWeek;
    
    -- Availability Exceptions
    SELECT 
        ExceptionID,
        StartDate,
        EndDate,
        StartTime,
        EndTime,
        IsAvailable,
        Reason
    FROM VendorAvailabilityExceptions
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY StartDate;
END;
GO

-- Procedure: [dbo].[sp_GetVendorBookingsAll]

-- Corrected stored procedure for vendor bookings

CREATE   PROCEDURE sp_GetVendorBookingsAll
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_VendorBookings
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY EventDate DESC;
END;
GO

-- Procedure: [dbo].[sp_GetVendorDashboard]

-- Corrected stored procedure for vendor dashboard using views from SQL_V3.SQL

CREATE   PROCEDURE sp_GetVendorDashboard
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Vendor profile info from view
    SELECT TOP 1 *
    FROM vw_VendorDetails
    WHERE UserID = @UserID;

    -- Recent bookings from view
    SELECT TOP 5 *
    FROM vw_VendorBookings
    WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID)
    ORDER BY EventDate DESC;

    -- Recent reviews from view
    SELECT TOP 5 *
    FROM vw_VendorReviews
    WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID)
    ORDER BY CreatedAt DESC;

    -- Unread messages count from view
    SELECT COUNT(*) AS UnreadMessages
    FROM vw_VendorConversations
    WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID)
    AND UnreadCount > 0;

    -- Unread notifications count
    SELECT COUNT(*) AS UnreadNotifications
    FROM Notifications
    WHERE UserID = @UserID
    AND IsRead = 0;

    -- Quick stats
    SELECT 
        (SELECT COUNT(*) FROM Bookings WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID)) AS TotalBookings,
        (SELECT COUNT(*) FROM Reviews WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID) AND IsApproved = 1) AS TotalReviews,
        (SELECT AVG(CAST(Rating AS DECIMAL(3,1))) FROM Reviews WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID) AND IsApproved = 1) AS AvgRating,
        (SELECT COUNT(*) FROM Favorites WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID)) AS TotalFavorites;
END;
GO

-- Procedure: [dbo].[sp_GetVendorDetails]


-- Enhanced get vendor details procedure
CREATE   PROCEDURE sp_GetVendorDetails
    @VendorProfileID INT,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Vendor profile
    SELECT * FROM vw_VendorDetails WHERE VendorProfileID = @VendorProfileID;
    
    -- Vendor categories
    SELECT Category FROM VendorCategories WHERE VendorProfileID = @VendorProfileID ORDER BY Category;
    
    -- Vendor services with categories
    SELECT 
        sc.CategoryID,
        sc.Name AS CategoryName,
        sc.Description AS CategoryDescription,
        s.ServiceID,
        s.Name AS ServiceName,
        s.Description AS ServiceDescription,
        s.Price,
        s.DurationMinutes,
        s.MinDuration,
        s.MaxAttendees,
        s.RequiresDeposit,
        s.DepositPercentage,
        s.CancellationPolicy
    FROM ServiceCategories sc
    JOIN Services s ON sc.CategoryID = s.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID
    AND s.IsActive = 1
    ORDER BY sc.DisplayOrder, sc.Name, s.Name;
    
    -- Service add-ons
    SELECT 
        sa.AddOnID,
        sa.ServiceID,
        sa.Name,
        sa.Description,
        sa.Price
    FROM ServiceAddOns sa
    JOIN Services s ON sa.ServiceID = s.ServiceID
    JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID
    AND sa.IsActive = 1
    ORDER BY sa.ServiceID, sa.Name;
    
    -- Vendor portfolio
    SELECT * FROM VendorPortfolio WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
    
    -- Vendor reviews
    SELECT * FROM vw_VendorReviews WHERE VendorProfileID = @VendorProfileID ORDER BY IsFeatured DESC, CreatedAt DESC;
    
    -- Vendor FAQs
    SELECT * FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
    
    -- Vendor team
    SELECT * FROM VendorTeam WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
    
    -- Vendor social media
    SELECT * FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
    
    -- Vendor business hours
    SELECT * FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID ORDER BY DayOfWeek;
    
    -- Vendor images
    SELECT * FROM VendorImages WHERE VendorProfileID = @VendorProfileID ORDER BY IsPrimary DESC, DisplayOrder;
    
    -- Is favorite for current user
    IF @UserID IS NOT NULL
    BEGIN
        SELECT CAST(CASE WHEN EXISTS (
            SELECT 1 FROM Favorites 
            WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
        ) THEN 1 ELSE 0 END AS BIT) AS IsFavorite;
    END
    
    -- Available time slots for next 30 days (simplified date calculation)
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
        (SELECT COUNT(*) FROM Bookings b 
         WHERE b.ServiceID = ts.ServiceID 
         AND b.Status NOT IN ('cancelled', 'rejected')
         AND (
             (ts.Date IS NOT NULL AND CONVERT(DATE, b.EventDate) = ts.Date)
             OR
             (ts.Date IS NULL AND DATEPART(WEEKDAY, b.EventDate) = ts.DayOfWeek + 1)
         )
         AND CONVERT(TIME, b.EventDate) BETWEEN ts.StartTime AND ts.EndTime
        ) AS BookedCount
    FROM TimeSlots ts
    JOIN Services s ON ts.ServiceID = s.ServiceID
    JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID
    AND ts.IsAvailable = 1
    AND (
        (ts.Date IS NULL) OR -- Recurring weekly slots
        (ts.Date BETWEEN @Today AND @EndDate) -- Specific date slots
    )
    ORDER BY 
        CASE WHEN ts.Date IS NULL THEN DATEADD(DAY, ts.DayOfWeek - DATEPART(WEEKDAY, @Today) + 7, @Today)
             ELSE ts.Date
        END,
        ts.StartTime;
END;
GO

-- Procedure: [dbo].[sp_GetVendorImages]

-- Corrected stored procedure for vendor images

CREATE   PROCEDURE sp_GetVendorImages
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM VendorImages
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY IsPrimary DESC, DisplayOrder;
END;
GO

-- Procedure: [dbo].[sp_GetVendorProfileDetails]

-- Corrected stored procedure for vendor profile details

CREATE   PROCEDURE sp_GetVendorProfileDetails
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_VendorDetails
    WHERE VendorProfileID = @VendorProfileID;
END;
GO

-- Procedure: [dbo].[sp_GetVendorReviews]

-- Stored procedure to get reviews for a vendor
CREATE   PROCEDURE sp_GetVendorReviews
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        r.ReviewID,
        u.Name AS ReviewerName,
        r.Rating,
        r.Comment,
        r.CreatedAt
    FROM Reviews r
    LEFT JOIN Users u ON r.UserID = u.UserID
    WHERE r.VendorProfileID = @VendorProfileID
    ORDER BY r.CreatedAt DESC;
END
GO

-- Procedure: [dbo].[sp_GetVendorReviewsAll]

-- NEW: Get all reviews for a specific vendor
CREATE   PROCEDURE sp_GetVendorReviewsAll
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT *
    FROM vw_VendorReviews
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY CreatedAt DESC;
END;
GO

-- Procedure: [dbo].[sp_GetVendorServices]

-- NEW: Get all services for a specific vendor
CREATE   PROCEDURE sp_GetVendorServices
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        sc.CategoryID,
        sc.Name AS CategoryName,
        sc.Description AS CategoryDescription,
        s.ServiceID,
        s.Name AS ServiceName,
        s.Description AS ServiceDescription,
        s.Price,
        s.DurationMinutes,
        s.MinDuration,
        s.MaxAttendees,
        s.IsActive,
        s.RequiresDeposit,
        s.DepositPercentage,
        s.CancellationPolicy,
        (SELECT TOP 1 si.ImageURL FROM ServiceImages si WHERE si.ServiceID = s.ServiceID AND si.IsPrimary = 1) AS PrimaryImage
    FROM ServiceCategories sc
    JOIN Services s ON sc.CategoryID = s.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID
    ORDER BY sc.DisplayOrder, sc.Name, s.Name;
END;
GO

-- Procedure: [dbo].[sp_GetVendorSetupData]

-- Get vendor setup data for editing
CREATE   PROCEDURE sp_GetVendorSetupData
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Vendor basic info
    SELECT 
        VendorProfileID,
        BusinessName,
        ISNULL(SetupStep, 1) AS SetupStep,
        ISNULL(SetupCompleted, 0) AS SetupCompleted
    FROM VendorProfiles 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Gallery images from VendorImages
    SELECT 
        ImageID,
        ImageURL,
        ISNULL(ImageType, 'upload') AS ImageType,
        Caption,
        DisplayOrder AS SortOrder
    FROM VendorImages 
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DisplayOrder;
    
    -- Packages from Services table (Packages category)
    SELECT 
        s.ServiceID AS PackageID,
        s.Name AS PackageName,
        s.Description,
        s.Price,
        CAST(s.DurationMinutes/60 AS NVARCHAR(10)) + ' hours' AS Duration,
        s.MaxAttendees AS MaxGuests,
        s.IsActive
    FROM Services s
    JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID AND s.ServiceType = 'Package' AND s.IsActive = 1
    ORDER BY s.CreatedAt;
    
    -- Services from Services table (non-Packages categories)
    SELECT 
        s.ServiceID,
        s.Name AS ServiceName,
        s.Description,
        s.Price,
        s.DurationMinutes,
        sc.Name AS CategoryName,
        s.IsActive
    FROM Services s
    JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID AND s.ServiceType = 'Service' AND s.IsActive = 1
    ORDER BY s.CreatedAt;
    
    -- Social Media from VendorSocialMedia
    SELECT 
        SocialID AS SocialMediaSetupID,
        Platform,
        URL
    FROM VendorSocialMedia 
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY Platform;
    
    -- Availability from VendorBusinessHours
    SELECT 
        HoursID AS AvailabilitySetupID,
        DayOfWeek,
        OpenTime AS StartTime,
        CloseTime AS EndTime,
        IsAvailable
    FROM VendorBusinessHours 
    WHERE VendorProfileID = @VendorProfileID AND IsAvailable = 1
    ORDER BY DayOfWeek;
END;
GO

-- Procedure: [dbo].[sp_GetVendorSetupProgress]

-- Get vendor setup progress
CREATE   PROCEDURE sp_GetVendorSetupProgress
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ISNULL(SetupStep, 1) AS SetupStep,
        ISNULL(SetupCompleted, 0) AS SetupCompleted,
        ISNULL(GalleryCompleted, 0) AS GalleryCompleted,
        ISNULL(PackagesCompleted, 0) AS PackagesCompleted,
        ISNULL(ServicesCompleted, 0) AS ServicesCompleted,
        ISNULL(SocialMediaCompleted, 0) AS SocialMediaCompleted,
        ISNULL(AvailabilityCompleted, 0) AS AvailabilityCompleted,
        (SELECT COUNT(*) FROM VendorImages WHERE VendorProfileID = @VendorProfileID) AS GalleryCount,
        (SELECT COUNT(*) FROM Services s 
         JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID 
         WHERE sc.VendorProfileID = @VendorProfileID AND s.ServiceType = 'Package') AS PackagesCount,
        (SELECT COUNT(*) FROM Services s 
         JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID 
         WHERE sc.VendorProfileID = @VendorProfileID AND s.ServiceType = 'Service') AS ServicesCount,
        (SELECT COUNT(*) FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID) AS SocialMediaCount,
        (SELECT COUNT(*) FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID) AS AvailabilityCount
    FROM VendorProfiles 
    WHERE VendorProfileID = @VendorProfileID;
END;
GO

-- Procedure: [dbo].[sp_RegisterSocialUser]

-- NEW: Stored procedure for social user registration or lookup
CREATE   PROCEDURE sp_RegisterSocialUser
    @Email NVARCHAR(100),
    @Name NVARCHAR(100),
    @AuthProvider NVARCHAR(20),
    @Avatar NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserID INT;

    SELECT @UserID = UserID FROM Users WHERE Email = @Email;

    IF @UserID IS NULL
    BEGIN
        -- User does not exist, create new user
        INSERT INTO Users (Name, Email, AuthProvider, Avatar, IsVendor)
        VALUES (@Name, @Email, @AuthProvider, @Avatar, 0); -- Default to client
        SET @UserID = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        -- User exists, update details if needed (e.g., AuthProvider, Name)
        UPDATE Users
        SET AuthProvider = @AuthProvider,
            Name = @Name,
            Avatar = ISNULL(@Avatar, Avatar),
            LastLogin = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE UserID = @UserID;
    END

    SELECT 
        u.UserID, 
        u.Name, 
        u.Email, 
        u.IsVendor, 
        vp.VendorProfileID
    FROM Users u
    LEFT JOIN VendorProfiles vp ON u.UserID = vp.UserID
    WHERE u.UserID = @UserID;
END;
GO

-- Procedure: [dbo].[sp_RegisterUser]

-- ======================
-- STORED PROCEDURES
-- ======================

-- User registration procedure
CREATE   PROCEDURE sp_RegisterUser
    @Name NVARCHAR(100),
    @Email NVARCHAR(100),
    @PasswordHash NVARCHAR(255),
    @IsVendor BIT = 0,
    @AuthProvider NVARCHAR(20) = 'email'
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Insert user
        INSERT INTO Users (Name, Email, PasswordHash, IsVendor, AuthProvider)
        VALUES (@Name, @Email, @PasswordHash, @IsVendor, @AuthProvider);
        
        DECLARE @UserID INT = SCOPE_IDENTITY();
        
        -- If vendor, create vendor profile
        IF @IsVendor = 1
        BEGIN
            INSERT INTO VendorProfiles (UserID, BusinessName)
            VALUES (@UserID, @Name);
        END
        
        COMMIT TRANSACTION;
        
        SELECT @UserID AS UserID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedure: [dbo].[sp_RegisterVendor]

--Register Vendor
CREATE   PROCEDURE sp_RegisterVendor
    @UserID INT,
    @BusinessName NVARCHAR(100),
    @DisplayName NVARCHAR(100),
    @BusinessDescription NVARCHAR(MAX),
    @BusinessPhone NVARCHAR(20),
    @Website NVARCHAR(255),
    @YearsInBusiness INT = NULL,
    @Address NVARCHAR(255),
    @City NVARCHAR(100),
    @State NVARCHAR(50),
    @Country NVARCHAR(50) = 'USA',
    @PostalCode NVARCHAR(20),
    @Categories NVARCHAR(MAX) = NULL,
    @Services NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Update user to be a vendor
        UPDATE Users SET IsVendor = 1, UpdatedAt = GETDATE() WHERE UserID = @UserID;

        DECLARE @VendorProfileID INT;
        -- Check if a vendor profile already exists for the user
        SELECT @VendorProfileID = VendorProfileID FROM VendorProfiles WHERE UserID = @UserID;

        IF @VendorProfileID IS NULL
        BEGIN
            -- Create new vendor profile
            INSERT INTO VendorProfiles (
                UserID,
                BusinessName,
                DisplayName,
                BusinessDescription,
                BusinessPhone,
                Website,
                YearsInBusiness,
                Address,
                City,
                State,
                Country,
                PostalCode,
                IsVerified,
                IsCompleted
            )
            VALUES (
                @UserID,
                @BusinessName,
                @DisplayName,
                @BusinessDescription,
                @BusinessPhone,
                @Website,
                @YearsInBusiness,
                @Address,
                @City,
                @State,
                @Country,
                @PostalCode,
                0, -- Not verified on signup
                0  -- Not completed yet (multi-step process)
            );
            
            SET @VendorProfileID = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            -- Update existing vendor profile
             UPDATE VendorProfiles
             SET
                BusinessName = @BusinessName,
                DisplayName = @DisplayName,
                BusinessDescription = @BusinessDescription,
                BusinessPhone = @BusinessPhone,
                Website = @Website,
                YearsInBusiness = @YearsInBusiness,
                Address = @Address,
                City = @City,
                State = @State,
                Country = @Country,
                PostalCode = @PostalCode,
                UpdatedAt = GETDATE()
             WHERE VendorProfileID = @VendorProfileID;
        END

        -- Remove existing categories and add new ones if provided
        DELETE FROM VendorCategories WHERE VendorProfileID = @VendorProfileID;
        IF @Categories IS NOT NULL
        BEGIN
            INSERT INTO VendorCategories (VendorProfileID, Category)
            SELECT @VendorProfileID, value
            FROM OPENJSON(@Categories);
        END
        
        -- Add services if provided
        -- This logic is now a separate step in the multi-step form, so we'll leave it simplified here.
        -- For a real application, you'd have a separate SP to handle services.
        
        COMMIT TRANSACTION;
        
        SELECT 
            1 AS Success,
            @UserID AS UserID,
            @VendorProfileID AS VendorProfileID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedure: [dbo].[sp_SearchVendors]
CREATE    PROCEDURE [dbo].[sp_SearchVendors]
    @SearchTerm NVARCHAR(100) = NULL,
    @Category NVARCHAR(50) = NULL,
    @MinPrice DECIMAL(10, 2) = NULL,
    @MaxPrice DECIMAL(10, 2) = NULL,
    @IsPremium BIT = NULL,
    @IsEcoFriendly BIT = NULL,
    @IsAwardWinning BIT = NULL,
    @Latitude DECIMAL(10, 8) = NULL,
    @Longitude DECIMAL(11, 8) = NULL,
    @RadiusMiles INT = 25,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @SortBy NVARCHAR(50) = 'recommended'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate pagination parameters
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 10;
    IF @PageSize > 100 SET @PageSize = 100;
    
    -- Calculate distance if location provided
    DECLARE @DistanceCalculation NVARCHAR(MAX) = '';
    IF @Latitude IS NOT NULL AND @Longitude IS NOT NULL
    BEGIN
        SET @DistanceCalculation = ', 3959 * ACOS(
            COS(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * COS(RADIANS(v.Latitude)) * COS(RADIANS(v.Longitude) - RADIANS(' + CAST(@Longitude AS NVARCHAR(20)) + ')) + 
            SIN(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * SIN(RADIANS(v.Latitude))
        ) AS DistanceMiles';
    END
    
    -- Build dynamic SQL for sorting
    DECLARE @SortExpression NVARCHAR(100);
    SET @SortExpression = CASE @SortBy
        WHEN 'price-low' THEN 'MinPrice ASC'
        WHEN 'price-high' THEN 'MinPrice DESC'
        WHEN 'rating' THEN 'AverageRating DESC'
        WHEN 'popular' THEN 'FavoriteCount DESC'
        WHEN 'nearest' THEN 'DistanceMiles ASC'
        ELSE 'BusinessName ASC'
    END;
    
    -- Build the full query with enhanced service and review data
    DECLARE @SQL NVARCHAR(MAX) = '
    WITH FilteredVendors AS (
        SELECT 
            v.VendorProfileID,
            v.BusinessName,
            v.DisplayName,
            v.BusinessDescription,
            v.City,
            v.State,
            v.Country,
            v.Latitude,
            v.Longitude,
            v.IsPremium,
            v.IsEcoFriendly,
            v.IsAwardWinning,
            v.PriceLevel,
            v.Capacity,
            v.Rooms,
            v.FeaturedImageURL,
            (SELECT MIN(s.Price) FROM Services s JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID WHERE sc.VendorProfileID = v.VendorProfileID) AS MinPrice,
            (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
            (SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
            (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) AS FavoriteCount,
            (SELECT COUNT(*) FROM Bookings b WHERE b.VendorProfileID = v.VendorProfileID) AS BookingCount,
            (SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1) AS ImageURL,
            (SELECT TOP 1 vc.Category FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS PrimaryCategory,
            (SELECT STRING_AGG(vc.Category, '', '') FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories,
            CASE 
                WHEN v.Latitude BETWEEN 35.0 AND 45.0 AND v.Longitude BETWEEN -80.0 AND -70.0 THEN ''north''
                WHEN v.Latitude BETWEEN 30.0 AND 35.0 AND v.Longitude BETWEEN -85.0 AND -75.0 THEN ''south''
                WHEN v.Latitude BETWEEN 38.0 AND 42.0 AND v.Longitude BETWEEN -90.0 AND -80.0 THEN ''midwest''
                WHEN v.Latitude BETWEEN 32.0 AND 40.0 AND v.Longitude BETWEEN -120.0 AND -100.0 THEN ''west''
                ELSE ''other''
            END AS Region'
            + @DistanceCalculation + '
        FROM VendorProfiles v
        JOIN Users u ON v.UserID = u.UserID
        WHERE u.IsActive = 1
        AND v
GO

-- Procedure: [dbo].[sp_SendMessage]

-- Send message procedure
CREATE   PROCEDURE sp_SendMessage
    @ConversationID INT,
    @SenderID INT,
    @Content NVARCHAR(MAX),
    @AttachmentURL NVARCHAR(255) = NULL,
    @AttachmentType NVARCHAR(50) = NULL,
    @AttachmentSize INT = NULL,
    @AttachmentName NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate conversation exists and user has access
    IF NOT EXISTS (
        SELECT 1 FROM Conversations c
        LEFT JOIN VendorProfiles v ON c.VendorProfileID = v.VendorProfileID
        WHERE c.ConversationID = @ConversationID
        AND (c.UserID = @SenderID OR v.UserID = @SenderID)
    )
    BEGIN
        RAISERROR('Conversation does not exist or user does not have access', 16, 1);
        RETURN;
    END
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Add message
        INSERT INTO Messages (
            ConversationID,
            SenderID,
            Content
        )
        VALUES (
            @ConversationID,
            @SenderID,
            @Content
        );
        
        DECLARE @MessageID INT = SCOPE_IDENTITY();
        
        -- Add attachment if provided
        IF @AttachmentURL IS NOT NULL
        BEGIN
            INSERT INTO MessageAttachments (
                MessageID,
                FileURL,
                FileType,
                FileSize,
                OriginalName
            )
            VALUES (
                @MessageID,
                @AttachmentURL,
                @AttachmentType,
                @AttachmentSize,
                @AttachmentName
            );
        END
        
        -- Update conversation last message
        UPDATE Conversations
        SET 
            LastMessageAt = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE ConversationID = @ConversationID;
        
        -- Get recipient ID and vendor info
        DECLARE @RecipientID INT;
        DECLARE @IsVendor BIT;
        DECLARE @VendorProfileID INT;
        DECLARE @VendorName NVARCHAR(100);
        DECLARE @UserName NVARCHAR(100);
        
        SELECT 
            @RecipientID = CASE WHEN c.UserID = @SenderID THEN v.UserID ELSE c.UserID END,
            @IsVendor = CASE WHEN c.UserID = @SenderID THEN 1 ELSE 0 END,
            @VendorProfileID = c.VendorProfileID,
            @VendorName = v.BusinessName,
            @UserName = u.Name
        FROM Conversations c
        JOIN VendorProfiles v ON c.VendorProfileID = v.VendorProfileID
        JOIN Users u ON c.UserID = u.UserID
        WHERE c.ConversationID = @ConversationID;
        
        -- Create notification
        IF @RecipientID IS NOT NULL
        BEGIN
            INSERT INTO Notifications (
                UserID,
                Type,
                Title,
                Message,
                RelatedID,
                RelatedType,
                ActionURL
            )
            VALUES (
                @RecipientID,
                'message',
                'New Message',
                'You have a new message from ' + @UserName,
                @MessageID,
                'message',
                CASE 
                    WHEN @IsVendor = 1 THEN '/vendor/messages/' + CAST(@ConversationID AS NVARCHAR(10))
                    ELSE '/messages/' + CAST(@ConversationID AS NVARCHAR(10))
                END
            );
        END
        
        COMMIT TRANSACTION;
        
        -- Return success with message details
        SELECT 
            @MessageID AS MessageID,
            @ConversationID AS ConversationID,
            @SenderID AS SenderID,
            GETDATE() AS SentAt;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO

-- Procedure: [dbo].[sp_SubmitReview]

-- Stored procedure to submit a review
CREATE   PROCEDURE sp_SubmitReview
    @UserID INT,
    @VendorProfileID INT,
    @Rating INT,
    @Comment NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Reviews (UserID, VendorProfileID, Rating, Comment, CreatedAt)
    VALUES (@UserID, @VendorProfileID, @Rating, @Comment, GETDATE());

    SELECT TOP 1 *
    FROM Reviews
    WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
    ORDER BY CreatedAt DESC;
END
GO

-- Procedure: [dbo].[sp_ToggleFavorite]

-- Create stored procedure for toggling favorites
CREATE   PROCEDURE sp_ToggleFavorite
    @UserID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if favorite exists
    IF EXISTS (SELECT 1 FROM Favorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID)
    BEGIN
        -- Remove favorite
        DELETE FROM Favorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID;
        SELECT 'removed' as Status, 0 as IsFavorite;
    END
    ELSE
    BEGIN
        -- Add favorite
        INSERT INTO Favorites (UserID, VendorProfileID, CreatedAt)
        VALUES (@UserID, @VendorProfileID, GETDATE());
        SELECT 'added' as Status, 1 as IsFavorite;
    END
END
GO

-- Procedure: [dbo].[sp_UpdateBookingStatus]

-- Update booking status procedure
CREATE   PROCEDURE sp_UpdateBookingStatus
    @BookingID INT,
    @Status NVARCHAR(20),
    @UserID INT,
    @Notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Update booking
        UPDATE Bookings
        SET 
            Status = @Status,
            UpdatedAt = GETDATE()
        WHERE BookingID = @BookingID;
        
        -- Add timeline entry
        INSERT INTO BookingTimeline (
            BookingID,
            Status,
            ChangedBy,
            Notes
        )
        VALUES (
            @BookingID,
            @Status,
            @UserID,
            @Notes
        );
        
        -- Get booking details for notification
        DECLARE @EventDate DATETIME;
        DECLARE @ClientID INT;
        DECLARE @VendorProfileID INT;
        DECLARE @ServiceName NVARCHAR(100);
        
        SELECT 
            @EventDate = b.EventDate,
            @ClientID = b.UserID,
            @VendorProfileID = b.VendorProfileID,
            @ServiceName = s.Name
        FROM Bookings b
        JOIN Services s ON b.ServiceID = s.ServiceID
        WHERE b.BookingID = @BookingID;
        
        -- Create appropriate notification
        IF @Status = 'confirmed'
        BEGIN
            -- Notify client
            INSERT INTO Notifications (
                UserID,
                Type,
                Title,
                Message,
                RelatedID,
                RelatedType,
                ActionURL
            )
            VALUES (
                @ClientID,
                'booking',
                'Booking Confirmed',
                'Your booking for ' + @ServiceName + ' on ' + CONVERT(NVARCHAR(20), @EventDate, 107) + ' has been confirmed',
                @BookingID,
                'booking',
                '/bookings/' + CAST(@BookingID AS NVARCHAR(10))
            );
            
            -- If deposit required, notify to pay
            IF EXISTS (
                SELECT 1 FROM Bookings b
                JOIN Services s ON b.ServiceID = s.ServiceID
                WHERE b.BookingID = @BookingID
                AND s.RequiresDeposit = 1
                AND b.DepositPaid = 0
            )
            BEGIN
                INSERT INTO Notifications (
                    UserID,
                    Type,
                    Title,
                    Message,
                    RelatedID,
                    RelatedType,
                    ActionURL
                )
                VALUES (
                    @ClientID,
                    'payment',
                    'Deposit Required',
                    'Please pay the deposit for your booking to secure your date',
                    @BookingID,
                    'booking',
                    '/bookings/' + CAST(@BookingID AS NVARCHAR(10)) + '/payment'
                );
            END
        END
        ELSE IF @Status = 'cancelled'
        BEGIN
            -- Notify client
            INSERT INTO Notifications (
                UserID,
                Type,
                Title,
                Message,
                RelatedID,
                RelatedType,
                ActionURL
            )
            VALUES (
                @ClientID,
                'booking',
                'Booking Cancelled',
                'Your booking for ' + @ServiceName + ' on ' + CONVERT(NVARCHAR(20), @EventDate, 107) + ' has been cancelled',
                @BookingID,
                'booking',
                '/bookings/' + CAST(@BookingID AS NVARCHAR(10))
            );
        END
        ELSE IF @Status = 'completed'
        BEGIN
            -- Notify client to leave review
            INSERT INTO Notifications (
                UserID,
                Type,
                Title,
                Message,
                RelatedID,
                RelatedType,
                ActionURL
            )
            VALUES (
GO

-- Procedure: [dbo].[sp_UpdateUserLocation]

-- Create or update user location
CREATE   PROCEDURE sp_UpdateUserLocation
    @UserID INT,
    @Latitude DECIMAL(10, 8),
    @Longitude DECIMAL(11, 8),
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(50) = NULL,
    @Country NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO UserLocations (
        UserID,
        Latitude,
        Longitude,
        City,
        State,
        Country
    )
    VALUES (
        @UserID,
        @Latitude,
        @Longitude,
        @City,
        @State,
        @Country
    );
    
    SELECT SCOPE_IDENTITY() AS LocationID;
END;
GO

-- Procedure: [dbo].[sp_UpdateUserPassword]

-- NEW: Update user password
CREATE   PROCEDURE sp_UpdateUserPassword
    @UserID INT,
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Users
    SET 
        PasswordHash = @PasswordHash,
        UpdatedAt = GETDATE()
    WHERE UserID = @UserID;

    SELECT 1 AS Success;
END;
GO

-- Procedure: [dbo].[sp_UpdateUserProfile]

-- NEW: Update user profile details
CREATE   PROCEDURE sp_UpdateUserProfile
    @UserID INT,
    @Name NVARCHAR(100) = NULL,
    @Phone NVARCHAR(20) = NULL,
    @Bio NVARCHAR(MAX) = NULL,
    @Avatar NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Users
    SET 
        Name = ISNULL(@Name, Name),
        Phone = ISNULL(@Phone, Phone),
        Bio = ISNULL(@Bio, Bio),
        Avatar = ISNULL(@Avatar, Avatar),
        UpdatedAt = GETDATE()
    WHERE UserID = @UserID;

    SELECT 1 AS Success;
END;
GO

-- Procedure: [dbo].[sp_UpdateVendorProfileAbout]

-- NEW: Update Vendor Profile from Step 3 (About)
CREATE   PROCEDURE sp_UpdateVendorProfileAbout
    @VendorProfileID INT,
    @Tagline NVARCHAR(255),
    @BusinessDescription NVARCHAR(MAX),
    @YearsInBusiness INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE VendorProfiles
    SET Tagline = @Tagline,
        BusinessDescription = @BusinessDescription,
        YearsInBusiness = @YearsInBusiness,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;

    SELECT 1 AS Success;
END;
GO

-- Procedure: [dbo].[sp_UpdateVendorProfileBasics]

-- NEW: Update Vendor Profile from Step 1 (Business Basics)
CREATE   PROCEDURE sp_UpdateVendorProfileBasics
    @VendorProfileID INT,
    @BusinessName NVARCHAR(100),
    @DisplayName NVARCHAR(100),
    @BusinessEmail NVARCHAR(100),
    @BusinessPhone NVARCHAR(20),
    @Website NVARCHAR(255),
    @Categories NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE VendorProfiles
    SET BusinessName = @BusinessName,
        DisplayName = @DisplayName,
        BusinessEmail = @BusinessEmail,
        BusinessPhone = @BusinessPhone,
        Website = @Website,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Update User's main email if needed
    UPDATE Users SET Email = @BusinessEmail WHERE UserID = (SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID);

    -- Update Categories
    DELETE FROM VendorCategories WHERE VendorProfileID = @VendorProfileID;
    IF @Categories IS NOT NULL
    BEGIN
        INSERT INTO VendorCategories (VendorProfileID, Category)
        SELECT @VendorProfileID, value
        FROM OPENJSON(@Categories);
    END
    
    SELECT 1 AS Success;
END;
GO

-- Procedure: [dbo].[sp_UpdateVendorProfileLocation]

-- NEW: Update Vendor Profile from Step 2 (Location Info)
CREATE   PROCEDURE sp_UpdateVendorProfileLocation
    @VendorProfileID INT,
    @Address NVARCHAR(255),
    @City NVARCHAR(100),
    @State NVARCHAR(50),
    @Country NVARCHAR(50),
    @PostalCode NVARCHAR(20),
    @Latitude DECIMAL(10, 8) = NULL,
    @Longitude DECIMAL(11, 8) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles
    SET Address = @Address,
        City = @City,
        State = @State,
        Country = @Country,
        PostalCode = @PostalCode,
        Latitude = @Latitude,
        Longitude = @Longitude,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;

    SELECT 1 AS Success;
END;
GO

-- Procedure: [dbo].[sp_UpdateVendorSetupStep]

-- Update vendor setup step
CREATE   PROCEDURE sp_UpdateVendorSetupStep
    @VendorProfileID INT,
    @Step INT,
    @Field NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET SetupStep = @Step,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Update specific completion flag if provided
    IF @Field IS NOT NULL
    BEGIN
        IF @Field = 'gallery'
            UPDATE VendorProfiles SET GalleryCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        ELSE IF @Field = 'packages'
            UPDATE VendorProfiles SET PackagesCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        ELSE IF @Field = 'services'
            UPDATE VendorProfiles SET ServicesCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        ELSE IF @Field = 'social_media'
            UPDATE VendorProfiles SET SocialMediaCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        ELSE IF @Field = 'availability'
            UPDATE VendorProfiles SET AvailabilityCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
    END
    
    -- Check if setup is complete
    UPDATE VendorProfiles 
    SET SetupCompleted = CASE 
        WHEN GalleryCompleted = 1 AND PackagesCompleted = 1 AND ServicesCompleted = 1 
             AND SocialMediaCompleted = 1 AND AvailabilityCompleted = 1 
        THEN 1 ELSE 0 
    END
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT 1 AS Success;
END;
GO

-- Procedure: [dbo].[sp_UpsertVendorAvailabilityException]

-- NEW: Add/Update Vendor Availability Exception
CREATE   PROCEDURE sp_UpsertVendorAvailabilityException
    @ExceptionID INT = NULL, -- NULL for new, ID for update
    @VendorProfileID INT,
    @StartDate DATE,
    @EndDate DATE,
    @StartTime TIME = NULL,
    @EndTime TIME = NULL,
    @IsAvailable BIT = 1,
    @Reason NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @ExceptionID IS NULL -- Insert new
    BEGIN
        INSERT INTO VendorAvailabilityExceptions (VendorProfileID, StartDate, EndDate, StartTime, EndTime, IsAvailable, Reason)
        VALUES (@VendorProfileID, @StartDate, @EndDate, @StartTime, @EndTime, @IsAvailable, @Reason);
        SELECT SCOPE_IDENTITY() AS ExceptionID;
    END
    ELSE -- Update existing
    BEGIN
        UPDATE VendorAvailabilityExceptions
        SET
            StartDate = @StartDate,
            EndDate = @EndDate,
            StartTime = @StartTime,
            EndTime = @EndTime,
            IsAvailable = @IsAvailable,
            Reason = @Reason,
            CreatedAt = GETDATE() -- Update timestamp for modification
        WHERE ExceptionID = @ExceptionID AND VendorProfileID = @VendorProfileID;
        SELECT @ExceptionID AS ExceptionID;
    END
END;
GO

-- Procedure: [dbo].[sp_UpsertVendorBusinessHour]

-- NEW: Add/Update Vendor Business Hour
CREATE   PROCEDURE sp_UpsertVendorBusinessHour
    @HoursID INT = NULL, -- NULL for new, ID for update
    @VendorProfileID INT,
    @DayOfWeek TINYINT,
    @OpenTime TIME = NULL,
    @CloseTime TIME = NULL,
    @IsAvailable BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF @HoursID IS NULL -- Insert new
    BEGIN
        INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable)
        VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, @IsAvailable);
        SELECT SCOPE_IDENTITY() AS HoursID;
    END
    ELSE -- Update existing
    BEGIN
        UPDATE VendorBusinessHours
        SET
            OpenTime = @OpenTime,
            CloseTime = @CloseTime,
            IsAvailable = @IsAvailable
        WHERE HoursID = @HoursID AND VendorProfileID = @VendorProfileID;
        SELECT @HoursID AS HoursID;
    END
END;
GO

-- Procedure: [dbo].[sp_UpsertVendorImage]

-- NEW: Add/Update Vendor Image
CREATE   PROCEDURE sp_UpsertVendorImage
    @ImageID INT = NULL, -- NULL for new image, ID for update
    @VendorProfileID INT,
    @ImageURL NVARCHAR(255),
    @IsPrimary BIT = 0,
    @Caption NVARCHAR(255) = NULL,
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF @ImageID IS NULL -- Insert new image
    BEGIN
        INSERT INTO VendorImages (VendorProfileID, ImageURL, IsPrimary, Caption, DisplayOrder)
        VALUES (@VendorProfileID, @ImageURL, @IsPrimary, @Caption, @DisplayOrder);
        SELECT SCOPE_IDENTITY() AS ImageID;
    END
    ELSE -- Update existing image
    BEGIN
        UPDATE VendorImages
        SET
            ImageURL = @ImageURL,
            IsPrimary = @IsPrimary,
            Caption = @Caption,
            DisplayOrder = @DisplayOrder
        WHERE ImageID = @ImageID AND VendorProfileID = @VendorProfileID;
        SELECT @ImageID AS ImageID;
    END

    -- Ensure only one primary image
    IF @IsPrimary = 1
    BEGIN
        UPDATE VendorImages
        SET IsPrimary = 0
        WHERE VendorProfileID = @VendorProfileID AND ImageID != ISNULL(@ImageID, 0);
    END
END;
GO

-- Procedure: [dbo].[sp_UpsertVendorService]

-- NEW: Add/Update Vendor Service
CREATE   PROCEDURE sp_UpsertVendorService
    @ServiceID INT = NULL, -- NULL for new service, ID for update
    @VendorProfileID INT,
    @CategoryName NVARCHAR(100),
    @ServiceName NVARCHAR(100),
    @ServiceDescription NVARCHAR(MAX),
    @Price DECIMAL(10, 2),
    @DurationMinutes INT = NULL,
    @MaxAttendees INT = NULL,
    @IsActive BIT = 1,
    @RequiresDeposit BIT = 1,
    @DepositPercentage DECIMAL(5,2) = 20.00,
    @CancellationPolicy NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CategoryID INT;

    -- Find or create ServiceCategory
    SELECT @CategoryID = CategoryID
    FROM ServiceCategories
    WHERE VendorProfileID = @VendorProfileID AND Name = @CategoryName;

    IF @CategoryID IS NULL
    BEGIN
        INSERT INTO ServiceCategories (VendorProfileID, Name, Description)
        VALUES (@VendorProfileID, @CategoryName, @CategoryName + ' services');
        SET @CategoryID = SCOPE_IDENTITY();
    END

    IF @ServiceID IS NULL -- Insert new service
    BEGIN
        INSERT INTO Services (
            CategoryID,
            Name,
            Description,
            Price,
            DurationMinutes,
            MaxAttendees,
            IsActive,
            RequiresDeposit,
            DepositPercentage,
            CancellationPolicy
        )
        VALUES (
            @CategoryID,
            @ServiceName,
            @ServiceDescription,
            @Price,
            @DurationMinutes,
            @MaxAttendees,
            @IsActive,
            @RequiresDeposit,
            @DepositPercentage,
            @CancellationPolicy
        );
        SELECT SCOPE_IDENTITY() AS ServiceID;
    END
    ELSE -- Update existing service
    BEGIN
        UPDATE Services
        SET
            CategoryID = @CategoryID,
            Name = @ServiceName,
            Description = @ServiceDescription,
            Price = @Price,
            DurationMinutes = @DurationMinutes,
            MaxAttendees = @MaxAttendees,
            IsActive = @IsActive,
            RequiresDeposit = @RequiresDeposit,
            DepositPercentage = @DepositPercentage,
            CancellationPolicy = @CancellationPolicy,
            UpdatedAt = GETDATE()
        WHERE ServiceID = @ServiceID;
        SELECT @ServiceID AS ServiceID;
    END
END;
GO

-- =============================================
-- TRIGGERS
-- =============================================

-- =============================================
-- DATABASE DDL GENERATION COMPLETE
-- =============================================

