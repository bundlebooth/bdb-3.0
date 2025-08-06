-- ======================
-- TABLES
-- ======================

-- Users table with enhanced fields
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Avatar NVARCHAR(255),
    Phone NVARCHAR(20),
    Bio NVARCHAR(MAX),
    IsVendor BIT DEFAULT 0,
    IsAdmin BIT DEFAULT 0,
    EmailVerified BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME,
    AuthProvider NVARCHAR(20) DEFAULT 'email',
    StripeCustomerID NVARCHAR(100),
    NotificationPreferences NVARCHAR(MAX) DEFAULT '{"email":true,"push":true}',
    IsActive BIT DEFAULT 1
);
GO

-- Vendor-specific information (separate from user profile)
CREATE TABLE VendorProfiles (
    VendorProfileID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID) UNIQUE,
    BusinessName NVARCHAR(100) NOT NULL,
    BusinessDescription NVARCHAR(MAX),
    BusinessPhone NVARCHAR(20),
    BusinessEmail NVARCHAR(100),
    Website NVARCHAR(255),
    YearsInBusiness INT,
    LicenseNumber NVARCHAR(50),
    InsuranceVerified BIT DEFAULT 0,
    IsVerified BIT DEFAULT 0,
    StripeAccountID NVARCHAR(100),
    AverageResponseTime INT,
    ResponseRate DECIMAL(5,2),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    Address NVARCHAR(255),
    City NVARCHAR(100),
    State NVARCHAR(50),
    Country NVARCHAR(50) DEFAULT 'USA',
    PostalCode NVARCHAR(20),
    Latitude DECIMAL(10, 8),
    Longitude DECIMAL(11, 8),
    IsPremium BIT DEFAULT 0,
    IsEcoFriendly BIT DEFAULT 0,
    IsAwardWinning BIT DEFAULT 0,
    PriceLevel NVARCHAR(10) DEFAULT '$$',
    Capacity INT,
    Rooms INT,
    FeaturedImageURL NVARCHAR(255)
);
GO

-- Vendor images table
CREATE TABLE VendorImages (
    ImageID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    ImageURL NVARCHAR(255) NOT NULL,
    IsPrimary BIT DEFAULT 0,
    DisplayOrder INT DEFAULT 0,
    Caption NVARCHAR(255)
);
GO

-- Vendor social media links
CREATE TABLE VendorSocialMedia (
    SocialID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    Platform NVARCHAR(50) NOT NULL,
    URL NVARCHAR(255) NOT NULL,
    DisplayOrder INT DEFAULT 0
);
GO

-- Vendor categories (multi-select)
CREATE TABLE VendorCategories (
    VendorCategoryID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    Category NVARCHAR(50) NOT NULL,
    CONSTRAINT UC_VendorCategory UNIQUE (VendorProfileID, Category)
);
GO

-- Vendor business hours
CREATE TABLE VendorBusinessHours (
    HoursID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    DayOfWeek TINYINT NOT NULL CHECK (DayOfWeek BETWEEN 0 AND 6), -- 0=Sunday
    OpenTime TIME,
    CloseTime TIME,
    IsAvailable BIT DEFAULT 1,
    CONSTRAINT UC_VendorDay UNIQUE (VendorProfileID, DayOfWeek)
);
GO

-- Vendor availability exceptions
CREATE TABLE VendorAvailabilityExceptions (
    ExceptionID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    StartTime TIME,
    EndTime TIME,
    IsAvailable BIT DEFAULT 1,
    Reason NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Vendor service areas
CREATE TABLE VendorServiceAreas (
    AreaID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    City NVARCHAR(100) NOT NULL,
    State NVARCHAR(50) NOT NULL,
    Country NVARCHAR(50) NOT NULL,
    RadiusMiles INT DEFAULT 25,
    AdditionalFee DECIMAL(10,2) DEFAULT 0.00,
    CONSTRAINT UC_VendorServiceArea UNIQUE (VendorProfileID, City, State, Country)
);
GO

-- Vendor portfolio items
CREATE TABLE VendorPortfolio (
    PortfolioID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    ImageURL NVARCHAR(255) NOT NULL,
    ProjectDate DATE,
    DisplayOrder INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Vendor FAQs
CREATE TABLE VendorFAQs (
    FAQID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    Question NVARCHAR(255) NOT NULL,
    Answer NVARCHAR(MAX) NOT NULL,
    DisplayOrder INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Vendor team members
CREATE TABLE VendorTeam (
    TeamMemberID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    Name NVARCHAR(100) NOT NULL,
    Role NVARCHAR(100),
    Bio NVARCHAR(MAX),
    ImageURL NVARCHAR(255),
    DisplayOrder INT DEFAULT 0
);
GO

-- Service categories
CREATE TABLE ServiceCategories (
    CategoryID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    DisplayOrder INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Services with enhanced fields
CREATE TABLE Services (
    ServiceID INT PRIMARY KEY IDENTITY(1,1),
    CategoryID INT FOREIGN KEY REFERENCES ServiceCategories(CategoryID),
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(10, 2) NOT NULL,
    DurationMinutes INT,
    MinDuration INT,
    MaxAttendees INT,
    IsActive BIT DEFAULT 1,
    RequiresDeposit BIT DEFAULT 1,
    DepositPercentage DECIMAL(5,2) DEFAULT 20.00,
    CancellationPolicy NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Time slots table
CREATE TABLE TimeSlots (
    SlotID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    ServiceID INT FOREIGN KEY REFERENCES Services(ServiceID),
    DayOfWeek TINYINT CHECK (DayOfWeek BETWEEN 0 AND 6), -- 0=Sunday, NULL for specific dates
    Date DATE, -- Specific date if not recurring
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    MaxCapacity INT,
    IsAvailable BIT DEFAULT 1,
    CONSTRAINT CHK_DayOrDate CHECK ((DayOfWeek IS NOT NULL AND Date IS NULL) OR (DayOfWeek IS NULL AND Date IS NOT NULL))
);
GO

-- Service add-ons
CREATE TABLE ServiceAddOns (
    AddOnID INT PRIMARY KEY IDENTITY(1,1),
    ServiceID INT FOREIGN KEY REFERENCES Services(ServiceID),
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(10, 2) NOT NULL,
    IsActive BIT DEFAULT 1
);
GO

-- Service images
CREATE TABLE ServiceImages (
    ImageID INT PRIMARY KEY IDENTITY(1,1),
    ServiceID INT FOREIGN KEY REFERENCES Services(ServiceID),
    ImageURL NVARCHAR(255) NOT NULL,
    IsPrimary BIT DEFAULT 0,
    DisplayOrder INT DEFAULT 0
);
GO

-- Service availability exceptions
CREATE TABLE ServiceAvailability (
    AvailabilityID INT PRIMARY KEY IDENTITY(1,1),
    ServiceID INT FOREIGN KEY REFERENCES Services(ServiceID),
    StartDateTime DATETIME NOT NULL,
    EndDateTime DATETIME NOT NULL,
    IsAvailable BIT DEFAULT 1,
    Reason NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Bookings with enhanced fields
CREATE TABLE Bookings (
    BookingID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    ServiceID INT FOREIGN KEY REFERENCES Services(ServiceID),
    BookingDate DATETIME DEFAULT GETDATE(),
    EventDate DATETIME NOT NULL,
    EndDate DATETIME,
    Status NVARCHAR(20) DEFAULT 'pending',
    TotalAmount DECIMAL(10, 2),
    DepositAmount DECIMAL(10, 2),
    DepositPaid BIT DEFAULT 0,
    FullAmountPaid BIT DEFAULT 0,
    AttendeeCount INT DEFAULT 1,
    SpecialRequests NVARCHAR(MAX),
    CancellationDate DATETIME,
    RefundAmount DECIMAL(10, 2),
    StripePaymentIntentID NVARCHAR(100),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Booking services (multi-service bookings)
CREATE TABLE BookingServices (
    BookingServiceID INT PRIMARY KEY IDENTITY(1,1),
    BookingID INT FOREIGN KEY REFERENCES Bookings(BookingID),
    ServiceID INT FOREIGN KEY REFERENCES Services(ServiceID),
    AddOnID INT FOREIGN KEY REFERENCES ServiceAddOns(AddOnID),
    Quantity INT DEFAULT 1,
    PriceAtBooking DECIMAL(10, 2) NOT NULL,
    Notes NVARCHAR(MAX)
);
GO

-- Booking timeline/status history
CREATE TABLE BookingTimeline (
    TimelineID INT PRIMARY KEY IDENTITY(1,1),
    BookingID INT FOREIGN KEY REFERENCES Bookings(BookingID),
    Status NVARCHAR(50) NOT NULL,
    ChangedBy INT FOREIGN KEY REFERENCES Users(UserID),
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Reviews with enhanced fields
CREATE TABLE Reviews (
    ReviewID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    BookingID INT FOREIGN KEY REFERENCES Bookings(BookingID),
    Rating TINYINT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Title NVARCHAR(100),
    Comment NVARCHAR(MAX),
    Response NVARCHAR(MAX),
    ResponseDate DATETIME,
    IsAnonymous BIT DEFAULT 0,
    IsFeatured BIT DEFAULT 0,
    IsApproved BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Review media (photos)
CREATE TABLE ReviewMedia (
    MediaID INT PRIMARY KEY IDENTITY(1,1),
    ReviewID INT FOREIGN KEY REFERENCES Reviews(ReviewID),
    ImageURL NVARCHAR(255) NOT NULL,
    DisplayOrder INT DEFAULT 0
);
GO

-- Favorites/wishlist
CREATE TABLE Favorites (
    FavoriteID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT UC_Favorite UNIQUE (UserID, VendorProfileID)
);
GO

-- Chat conversations
CREATE TABLE Conversations (
    ConversationID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    BookingID INT FOREIGN KEY REFERENCES Bookings(BookingID),
    Subject NVARCHAR(255),
    LastMessageAt DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Chat messages
CREATE TABLE Messages (
    MessageID INT PRIMARY KEY IDENTITY(1,1),
    ConversationID INT FOREIGN KEY REFERENCES Conversations(ConversationID),
    SenderID INT FOREIGN KEY REFERENCES Users(UserID),
    Content NVARCHAR(MAX) NOT NULL,
    IsRead BIT DEFAULT 0,
    ReadAt DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Message attachments
CREATE TABLE MessageAttachments (
    AttachmentID INT PRIMARY KEY IDENTITY(1,1),
    MessageID INT FOREIGN KEY REFERENCES Messages(MessageID),
    FileURL NVARCHAR(255) NOT NULL,
    FileType NVARCHAR(50),
    FileSize INT,
    OriginalName NVARCHAR(255)
);
GO

-- Notifications with enhanced fields
CREATE TABLE Notifications (
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Type NVARCHAR(50) NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    IsRead BIT DEFAULT 0,
    ReadAt DATETIME,
    RelatedID INT, -- Could be BookingID, MessageID, etc.
    RelatedType NVARCHAR(50), -- 'booking', 'message', 'review'
    ActionURL NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- User payment methods
CREATE TABLE PaymentMethods (
    PaymentMethodID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    StripePaymentMethodID NVARCHAR(100) NOT NULL,
    IsDefault BIT DEFAULT 0,
    CardBrand NVARCHAR(50),
    Last4 NVARCHAR(4),
    ExpMonth INT,
    ExpYear INT,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Transactions/payments
CREATE TABLE Transactions (
    TransactionID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    BookingID INT FOREIGN KEY REFERENCES Bookings(BookingID),
    Amount DECIMAL(10, 2) NOT NULL,
    FeeAmount DECIMAL(10, 2),
    NetAmount DECIMAL(10, 2),
    Currency NVARCHAR(3) DEFAULT 'USD',
    Description NVARCHAR(255),
    StripeChargeID NVARCHAR(100),
    Status NVARCHAR(20) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- User location history
CREATE TABLE UserLocations (
    LocationID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Latitude DECIMAL(10, 8) NOT NULL,
    Longitude DECIMAL(11, 8) NOT NULL,
    City NVARCHAR(100),
    State NVARCHAR(50),
    Country NVARCHAR(50),
    Timestamp DATETIME DEFAULT GETDATE()
);
GO

-- Search history
CREATE TABLE SearchHistory (
    SearchID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    SearchTerm NVARCHAR(255),
    Category NVARCHAR(50),
    Location NVARCHAR(255),
    Filters NVARCHAR(MAX), -- JSON string of filters used
    Timestamp DATETIME DEFAULT GETDATE()
);
GO

-- User sessions
CREATE TABLE UserSessions (
    SessionID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Token NVARCHAR(255) NOT NULL,
    IPAddress NVARCHAR(50),
    UserAgent NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    ExpiresAt DATETIME NOT NULL,
    IsActive BIT DEFAULT 1
);
GO

-- ======================
-- VIEWS
-- ======================

-- Vendor details view
CREATE OR ALTER VIEW vw_VendorDetails AS
SELECT 
    v.VendorProfileID,
    v.UserID,
    u.Name AS OwnerName,
    u.Email AS OwnerEmail,
    u.Phone AS OwnerPhone,
    v.BusinessName,
    v.BusinessDescription,
    v.BusinessPhone,
    v.BusinessEmail,
    v.Website,
    v.YearsInBusiness,
    v.LicenseNumber,
    v.InsuranceVerified,
    v.IsVerified,
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

-- Vendor services view
CREATE OR ALTER VIEW vw_VendorServices AS
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

-- User bookings view
CREATE OR ALTER VIEW vw_UserBookings AS
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

-- Vendor bookings view
CREATE OR ALTER VIEW vw_VendorBookings AS
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

-- User favorites view
CREATE OR ALTER VIEW vw_UserFavorites AS
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

-- Vendor reviews view
CREATE OR ALTER VIEW vw_VendorReviews AS
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

-- User conversations view
CREATE OR ALTER VIEW vw_UserConversations AS
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

-- Vendor conversations view
CREATE OR ALTER VIEW vw_VendorConversations AS
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

-- User notifications view
CREATE OR ALTER VIEW vw_UserNotifications AS
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

-- Vendor search results view
CREATE OR ALTER VIEW vw_VendorSearchResults AS
SELECT 
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

-- ======================
-- STORED PROCEDURES
-- ======================

-- User registration procedure
CREATE OR ALTER PROCEDURE sp_RegisterUser
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

--Register Vendor
CREATE OR ALTER PROCEDURE sp_RegisterVendor
    @Name NVARCHAR(100),
    @Email NVARCHAR(100),
    @PasswordHash NVARCHAR(255),
    @BusinessName NVARCHAR(100),
    @BusinessDescription NVARCHAR(MAX),
    @BusinessPhone NVARCHAR(20),
    @Website NVARCHAR(255),
    @YearsInBusiness INT = NULL,
    @Address NVARCHAR(255),
    @City NVARCHAR(100),
    @State NVARCHAR(50),
    @Country NVARCHAR(50) = 'USA',
    @Categories NVARCHAR(MAX) = NULL,
    @Services NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Insert user
        INSERT INTO Users (Name, Email, PasswordHash, IsVendor)
        VALUES (@Name, @Email, @PasswordHash, 1);
        
        DECLARE @UserID INT = SCOPE_IDENTITY();
        
        -- Create vendor profile
        INSERT INTO VendorProfiles (
            UserID,
            BusinessName,
            BusinessDescription,
            BusinessPhone,
            BusinessEmail,
            Website,
            YearsInBusiness,
            Address,
            City,
            State,
            Country
        )
        VALUES (
            @UserID,
            @BusinessName,
            @BusinessDescription,
            @BusinessPhone,
            @Email,
            @Website,
            @YearsInBusiness,
            @Address,
            @City,
            @State,
            @Country
        );
        
        DECLARE @VendorProfileID INT = SCOPE_IDENTITY();
        
        -- Add categories if provided
        IF @Categories IS NOT NULL
        BEGIN
            INSERT INTO VendorCategories (VendorProfileID, Category)
            SELECT @VendorProfileID, value
            FROM OPENJSON(@Categories);
        END
        
        -- Add services if provided
        IF @Services IS NOT NULL
        BEGIN
            -- First create a default service category
            DECLARE @CategoryID INT;
            
            INSERT INTO ServiceCategories (VendorProfileID, Name, Description)
            VALUES (@VendorProfileID, 'General Services', 'Default service category');
            
            SET @CategoryID = SCOPE_IDENTITY();
            
            -- Add services using the correct JSON parsing syntax
            INSERT INTO Services (CategoryID, Name, Description, Price)
            SELECT 
                @CategoryID,
                JSON_VALUE([value], '$.name'),
                JSON_VALUE([value], '$.description'),
                CAST(JSON_VALUE([value], '$.price') AS DECIMAL(10,2))
            FROM OPENJSON(@Services);
        END
        
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
    
-- Enhanced vendor search procedure with location filtering
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE   PROCEDURE [dbo].[sp_SearchVendors]
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
        AND v.IsVerified = 1
        AND (@SearchTerm IS NULL OR v.BusinessName LIKE ''%'' + @SearchTerm + ''%'' OR v.BusinessDescription LIKE ''%'' + @SearchTerm + ''%'')
        AND (@Category IS NULL OR EXISTS (SELECT 1 FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID AND vc.Category = @Category))
        AND (@IsPremium IS NULL OR v.IsPremium = @IsPremium)
        AND (@IsEcoFriendly IS NULL OR v.IsEcoFriendly = @IsEcoFriendly)
        AND (@IsAwardWinning IS NULL OR v.IsAwardWinning = @IsAwardWinning)
        AND (@MinPrice IS NULL OR (SELECT MIN(s.Price) FROM Services s JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID WHERE sc.VendorProfileID = v.VendorProfileID) >= @MinPrice)
        AND (@MaxPrice IS NULL OR (SELECT MIN(s.Price) FROM Services s JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID WHERE sc.VendorProfileID = v.VendorProfileID) <= @MaxPrice)'
    
    -- Add distance filter if location provided
    IF @Latitude IS NOT NULL AND @Longitude IS NOT NULL
    BEGIN
        SET @SQL = @SQL + '
        AND v.Latitude IS NOT NULL AND v.Longitude IS NOT NULL
        AND 3959 * ACOS(
            COS(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * COS(RADIANS(v.Latitude)) * COS(RADIANS(v.Longitude) - RADIANS(' + CAST(@Longitude AS NVARCHAR(20)) + ')) + 
            SIN(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * SIN(RADIANS(v.Latitude))
        ) <= @RadiusMiles'
    END
    
    -- Complete the query with enhanced JSON output for services and reviews
    SET @SQL = @SQL + '
    )
    SELECT 
        VendorProfileID AS id,
        BusinessName AS name,
        PrimaryCategory AS type,
        CONCAT(City, '', '', State) AS location,
        BusinessDescription AS description,
        ''$'' + CAST(MinPrice AS NVARCHAR(20)) AS price,
        PriceLevel AS priceLevel,
        CAST(AverageRating AS NVARCHAR(10)) AS rating,
        ReviewCount,
        FavoriteCount,
        BookingCount,
        ImageURL AS image,
        IsPremium,
        IsEcoFriendly,
        IsAwardWinning,
        Capacity,
        Rooms,
        Region,
        Categories,
        (SELECT COUNT(*) FROM FilteredVendors) AS TotalCount,
        JSON_QUERY((
            SELECT 
                sc.CategoryID,
                sc.Name AS category,
                sc.Description AS categoryDescription,
                JSON_QUERY((
                    SELECT 
                        s.ServiceID,
                        s.Name AS name,
                        s.Description AS description,
                        s.Price,
                        s.DurationMinutes,
                        s.MaxAttendees,
                        s.RequiresDeposit,
                        s.DepositPercentage,
                        (SELECT TOP 1 si.ImageURL FROM ServiceImages si WHERE si.ServiceID = s.ServiceID AND si.IsPrimary = 1) AS image,
                        (SELECT COUNT(*) FROM Bookings b WHERE b.ServiceID = s.ServiceID) AS bookingCount
                    FROM Services s
                    WHERE s.CategoryID = sc.CategoryID AND s.IsActive = 1
                    FOR JSON PATH
                )) AS services
            FROM ServiceCategories sc
            WHERE sc.VendorProfileID = v.VendorProfileID
            FOR JSON PATH
        )) AS services,
        JSON_QUERY((
            SELECT TOP 3
                r.ReviewID,
                r.Rating,
                r.Title,
                LEFT(r.Comment, 100) + CASE WHEN LEN(r.Comment) > 100 THEN ''...'' ELSE '''' END AS commentPreview,
                r.CreatedAt,
                u.Name AS reviewerName,
                u.Avatar AS reviewerAvatar,
                (SELECT COUNT(*) FROM ReviewMedia rm WHERE rm.ReviewID = r.ReviewID) AS mediaCount
            FROM Reviews r
            JOIN Users u ON r.UserID = u.UserID
            WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1
            ORDER BY r.CreatedAt DESC
            FOR JSON PATH
        )) AS reviews
    FROM FilteredVendors v
    ORDER BY ' + @SortExpression + '
    OFFSET (' + CAST((@PageNumber - 1) * @PageSize AS NVARCHAR(10)) + ') ROWS
    FETCH NEXT ' + CAST(@PageSize AS NVARCHAR(10)) + ' ROWS ONLY'
    
    -- Execute the dynamic SQL
    BEGIN TRY
        EXEC sp_executesql @SQL, 
            N'@SearchTerm NVARCHAR(100), @Category NVARCHAR(50), @MinPrice DECIMAL(10, 2), @MaxPrice DECIMAL(10, 2), 
              @IsPremium BIT, @IsEcoFriendly BIT, @IsAwardWinning BIT, @Latitude DECIMAL(10, 8), @Longitude DECIMAL(11, 8), 
              @RadiusMiles INT',
            @SearchTerm, @Category, @MinPrice, @MaxPrice, @IsPremium, @IsEcoFriendly, @IsAwardWinning, 
            @Latitude, @Longitude, @RadiusMiles
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error searching vendors: %s', 16, 1, @ErrorMessage);
    END CATCH
END;
GO


-- Enhanced get vendor details procedure
CREATE OR ALTER PROCEDURE sp_GetVendorDetails
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

-- Get user favorites
CREATE OR ALTER PROCEDURE sp_GetUserFavorites
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
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
        v.Capacity,
        v.Rooms,
        v.IsPremium,
        v.IsEcoFriendly,
        v.IsAwardWinning
    FROM Favorites f
    JOIN VendorProfiles v ON f.VendorProfileID = v.VendorProfileID
    WHERE f.UserID = @UserID
    ORDER BY f.CreatedAt DESC;
END;
GO

CREATE OR ALTER PROCEDURE sp_GetServiceAvailability
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

-- Create booking with multiple services
CREATE OR ALTER PROCEDURE sp_CreateBookingWithServices
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
        
        SELECT @BookingID AS BookingID, @ConversationID AS ConversationID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Create booking procedure (single service)
CREATE OR ALTER PROCEDURE sp_CreateBooking
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
        
        SELECT @BookingID AS BookingID, @ConversationID AS ConversationID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Get booking details
CREATE OR ALTER PROCEDURE sp_GetBookingDetails
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

-- Update booking status procedure
CREATE OR ALTER PROCEDURE sp_UpdateBookingStatus
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
                @ClientID,
                'review',
                'Leave a Review',
                'How was your experience with ' + (SELECT BusinessName FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID) + '?',
                @BookingID,
                'booking',
                '/bookings/' + CAST(@BookingID AS NVARCHAR(10)) + '/review'
            );
        END
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Add review procedure
CREATE OR ALTER PROCEDURE sp_AddReview
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

--Creates Conversation , and handles creating conversation for booking
CREATE OR ALTER PROCEDURE sp_CreateConversation
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


    
-- Get conversation messages
CREATE OR ALTER PROCEDURE sp_GetConversationMessages
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

-- Send message procedure
CREATE OR ALTER PROCEDURE sp_SendMessage
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

-- Get user notifications
CREATE OR ALTER PROCEDURE sp_GetUserNotifications
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

-- Create or update user location
CREATE OR ALTER PROCEDURE sp_UpdateUserLocation
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

-- Get nearby vendors
CREATE OR ALTER PROCEDURE sp_GetNearbyVendors
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

-- Create payment intent for booking
CREATE OR ALTER PROCEDURE sp_CreateBookingPaymentIntent
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

-- Confirm booking payment
CREATE OR ALTER PROCEDURE sp_ConfirmBookingPayment
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

-- Get vendor dashboard analytics
CREATE OR ALTER PROCEDURE sp_GetVendorAnalytics
    @VendorProfileID INT,
    @StartDate DATE = NULL,
    @EndDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Set default date range (last 30 days)
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

-- Get user dashboard data
CREATE OR ALTER PROCEDURE sp_GetUserDashboard
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

-- Get vendor dashboard data
CREATE OR ALTER PROCEDURE sp_GetVendorDashboard
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Vendor profile info
    SELECT 
        v.VendorProfileID,
        v.BusinessName,
        v.BusinessDescription,
        u.Avatar,
        (SELECT STRING_AGG(vc.Category, ', ') FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories,
        v.AverageResponseTime,
        v.ResponseRate
    FROM VendorProfiles v
    JOIN Users u ON v.UserID = u.UserID
    WHERE v.UserID = @UserID;
    
    -- Recent bookings
    SELECT TOP 5 *
    FROM vw_VendorBookings
    WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID)
    AND EventDate >= GETDATE()
    AND Status NOT IN ('cancelled', 'rejected')
    ORDER BY EventDate;
    
    -- Recent reviews
    SELECT TOP 3 *
    FROM vw_VendorReviews
    WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID)
    ORDER BY CreatedAt DESC;
    
    -- Unread messages
    SELECT COUNT(*) AS UnreadMessages
    FROM vw_VendorConversations
    WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID)
    AND UnreadCount > 0;
    
    -- Unread notifications
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

-- NEW: Get all bookings for a specific user
CREATE OR ALTER PROCEDURE sp_GetUserBookingsAll
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

-- NEW: Get all reviews made by a specific user
CREATE OR ALTER PROCEDURE sp_GetUserReviews
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

-- NEW: Get full user profile details for settings
CREATE OR ALTER PROCEDURE sp_GetUserProfileDetails
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

-- NEW: Update user profile details
CREATE OR ALTER PROCEDURE sp_UpdateUserProfile
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

-- NEW: Update user password
CREATE OR ALTER PROCEDURE sp_UpdateUserPassword
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

-- NEW: Get all bookings for a specific vendor
CREATE OR ALTER PROCEDURE sp_GetVendorBookingsAll
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

-- NEW: Get all services for a specific vendor
CREATE OR ALTER PROCEDURE sp_GetVendorServices
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

-- NEW: Get all reviews for a specific vendor
CREATE OR ALTER PROCEDURE sp_GetVendorReviewsAll
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

-- NEW: Get full vendor profile details for settings
CREATE OR ALTER PROCEDURE sp_GetVendorProfileDetails
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        vp.VendorProfileID,
        vp.UserID,
        vp.BusinessName,
        vp.BusinessDescription,
        vp.BusinessPhone,
        vp.BusinessEmail,
        vp.Website,
        vp.YearsInBusiness,
        vp.Address,
        vp.City,
        vp.State,
        vp.Country,
        vp.PostalCode,
        vp.IsPremium,
        vp.IsEcoFriendly,
        vp.IsAwardWinning,
        vp.PriceLevel,
        vp.Capacity,
        vp.Rooms,
        vp.FeaturedImageURL,
        (SELECT STRING_AGG(vc.Category, ', ') FROM VendorCategories vc WHERE vc.VendorProfileID = vp.VendorProfileID) AS Categories
    FROM VendorProfiles vp
    WHERE vp.VendorProfileID = @VendorProfileID;
END;
GO

-- NEW: Get vendor images
CREATE OR ALTER PROCEDURE sp_GetVendorImages
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ImageID,
        ImageURL,
        IsPrimary,
        Caption,
        DisplayOrder
    FROM VendorImages
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY IsPrimary DESC, DisplayOrder;
END;
GO

-- NEW: Get vendor availability (business hours and exceptions)
CREATE OR ALTER PROCEDURE sp_GetVendorAvailability
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

-- NEW: Add/Update Vendor Service
CREATE OR ALTER PROCEDURE sp_UpsertVendorService
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

-- NEW: Delete Vendor Service
CREATE OR ALTER PROCEDURE sp_DeleteVendorService
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

-- NEW: Add/Update Vendor Image
CREATE OR ALTER PROCEDURE sp_UpsertVendorImage
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

-- NEW: Delete Vendor Image
CREATE OR ALTER PROCEDURE sp_DeleteVendorImage
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

-- NEW: Add/Update Vendor Business Hour
CREATE OR ALTER PROCEDURE sp_UpsertVendorBusinessHour
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

-- NEW: Delete Vendor Business Hour
CREATE OR ALTER PROCEDURE sp_DeleteVendorBusinessHour
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

-- NEW: Add/Update Vendor Availability Exception
CREATE OR ALTER PROCEDURE sp_UpsertVendorAvailabilityException
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

-- NEW: Delete Vendor Availability Exception
CREATE OR ALTER PROCEDURE sp_DeleteVendorAvailabilityException
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
