-- Enhanced VenueVue Database Schema
-- Includes all requested features: user dashboards, vendor profiles, chat system, booking calendar, etc.

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
    NotificationPreferences NVARCHAR(MAX) DEFAULT '{"email":true,"push":true}'
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
    UpdatedAt DATETIME DEFAULT GETDATE()
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

-- ======================
-- VIEWS
-- ======================

-- Vendor details view
CREATE VIEW vw_VendorDetails AS
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
    (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) AS FavoriteCount,
    (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1)) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
    (SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
    (SELECT COUNT(*) FROM Bookings b WHERE b.VendorProfileID = v.VendorProfileID) AS BookingCount,
    (SELECT STRING_AGG(vc.Category, ', ') FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories
FROM VendorProfiles v
JOIN Users u ON v.UserID = u.UserID
WHERE u.IsActive = 1;
GO

-- Vendor services view
CREATE VIEW vw_VendorServices AS
SELECT 
    s.ServiceID,
    s.CategoryID,
    sc.Name AS CategoryName,
    s.VendorProfileID,
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
CREATE VIEW vw_UserBookings AS
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
CREATE VIEW vw_VendorBookings AS
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
CREATE VIEW vw_UserFavorites AS
SELECT 
    f.FavoriteID,
    f.UserID,
    f.VendorProfileID,
    v.BusinessName AS VendorName,
    v.BusinessDescription,
    (SELECT STRING_AGG(vc.Category, ', ') FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories,
    (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1)) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
    (SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
    (SELECT TOP 1 p.ImageURL FROM VendorPortfolio p WHERE p.VendorProfileID = v.VendorProfileID ORDER BY p.DisplayOrder) AS PortfolioImage
FROM Favorites f
JOIN VendorProfiles v ON f.VendorProfileID = v.VendorProfileID;
GO

-- Vendor reviews view
CREATE VIEW vw_VendorReviews AS
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
CREATE VIEW vw_UserConversations AS
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
CREATE VIEW vw_VendorConversations AS
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
CREATE VIEW vw_UserNotifications AS
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

-- Vendor search procedure with pagination and location filtering
CREATE OR ALTER PROCEDURE sp_SearchVendors
    @SearchTerm NVARCHAR(100) = NULL,
    @Category NVARCHAR(50) = NULL,
    @MinPrice DECIMAL(10, 2) = NULL,
    @MaxPrice DECIMAL(10, 2) = NULL,
    @IsPremium BIT = NULL,
    @IsEcoFriendly BIT = NULL,
    @IsAwardWinning BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Return results in the exact format expected by frontend
    SELECT 
        v.VendorID AS id,
        v.Name AS name,
        -- Extract city/state from location (simplified)
        CASE 
            WHEN CHARINDEX(',', v.Location) > 0 
            THEN SUBSTRING(v.Location, CHARINDEX(',', v.Location) + 2, LEN(v.Location))
            ELSE v.Location
        END AS location,
        CASE 
            WHEN v.Category = 'venue' THEN 'Hotel'
            WHEN v.Category = 'photo' THEN 'Photography'
            WHEN v.Category = 'music' THEN 'Entertainment'
            WHEN v.Category = 'catering' THEN 'Catering'
            ELSE v.Category
        END AS type,
        v.PriceLevel AS priceLevel,
        -- Format price as string (using first service price as example)
        (SELECT TOP 1 '$' + FORMAT(Price, 'N0') 
         FROM Services s
         JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
         WHERE sc.VendorID = v.VendorID
         ORDER BY s.Price DESC) AS price,
        CAST(v.Rating AS NVARCHAR(10)) + ' (' + CAST(v.ReviewCount AS NVARCHAR(10)) + ')' AS rating,
        v.Description AS description,
        COALESCE((SELECT TOP 1 ImageURL FROM VendorImages WHERE VendorID = v.VendorID), '🏨') AS image,
        CASE 
            WHEN (SELECT COUNT(*) FROM Favorites WHERE VendorID = v.VendorID) > 20 THEN 'Popular'
            WHEN v.IsPremium = 1 THEN 'Premium'
            ELSE NULL
        END AS badge,
        '50-300' AS capacity, -- Placeholder - would normally come from vendor data
        '208 rooms' AS rooms, -- Placeholder - would normally come from vendor data
        v.IsPremium,
        v.IsEcoFriendly,
        v.IsAwardWinning,
        JSON_QUERY((
            SELECT 
                sc.Name AS category,
                JSON_QUERY((
                    SELECT 
                        s.Name AS name,
                        s.Description AS description,
                        '$' + FORMAT(s.Price, 'N0') + CASE WHEN s.DurationMinutes IS NOT NULL 
                                                      THEN ' for ' + CAST(s.DurationMinutes/60 AS VARCHAR) + ' hours'
                                                      ELSE ' per person' END AS price
                    FROM Services s
                    WHERE s.CategoryID = sc.CategoryID AND s.IsActive = 1
                    FOR JSON PATH
                )) AS services
            FROM ServiceCategories sc
            WHERE sc.VendorID = v.VendorID
            FOR JSON PATH
        )) AS services
    FROM Vendors v
    JOIN Users u ON v.UserID = u.UserID
    WHERE v.IsActive = 1
    AND (@Category IS NULL OR v.Category = @Category)
    AND (@SearchTerm IS NULL OR v.Name LIKE '%' + @SearchTerm + '%' OR v.Description LIKE '%' + @SearchTerm + '%')
    AND (@IsPremium IS NULL OR v.IsPremium = @IsPremium)
    AND (@IsEcoFriendly IS NULL OR v.IsEcoFriendly = @IsEcoFriendly)
    AND (@IsAwardWinning IS NULL OR v.IsAwardWinning = @IsAwardWinning)
    ORDER BY v.Name;
END;
GO

-- Get vendor details with all related information
CREATE OR ALTER PROCEDURE sp_GetVendorDetails
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Vendor profile
    SELECT * FROM vw_VendorDetails WHERE VendorProfileID = @VendorProfileID;
    
    -- Vendor categories
    SELECT Category FROM VendorCategories WHERE VendorProfileID = @VendorProfileID ORDER BY Category;
    
    -- Vendor services
    SELECT * FROM vw_VendorServices WHERE VendorProfileID = @VendorProfileID ORDER BY CategoryName, ServiceName;
    
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
END;
GO

-- Get service availability
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
END;
GO

-- Create booking procedure
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
                    '/bookings/' + CAST(@BookingID AS NVARCHAR(10) + '/payment'
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
                '/bookings/' + CAST(@BookingID AS NVARCHAR(10) + '/review')
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
        
        -- Get recipient ID
        DECLARE @RecipientID INT;
        DECLARE @IsVendor BIT;
        DECLARE @VendorProfileID INT;
        
        SELECT 
            @RecipientID = CASE WHEN c.UserID = @SenderID THEN v.UserID ELSE c.UserID END,
            @IsVendor = CASE WHEN c.UserID = @SenderID THEN 1 ELSE 0 END,
            @VendorProfileID = c.VendorProfileID
        FROM Conversations c
        JOIN VendorProfiles v ON c.VendorProfileID = v.VendorProfileID
        WHERE c.ConversationID = @ConversationID;
        
        -- Create notification
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
            'You have a new message from ' + (SELECT Name FROM Users WHERE UserID = @SenderID),
            @MessageID,
            'message',
            CASE 
                WHEN @IsVendor = 1 THEN '/vendor/messages/' + CAST(@ConversationID AS NVARCHAR(10))
                ELSE '/messages/' + CAST(@ConversationID AS NVARCHAR(10))
            END
        );
        
        COMMIT TRANSACTION;
        
        SELECT @MessageID AS MessageID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
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
    ORDER BY FavoriteID DESC;
    
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

-- ======================
-- TEST DATA
-- ======================

-- Insert test users
INSERT INTO Users (Name, Email, PasswordHash, Avatar, Phone, Bio, IsVendor, IsAdmin, EmailVerified, AuthProvider)
VALUES 
('John Doe', 'john@example.com', '$2a$10$xJwL5v5Jz5U5Z5U5Z5U5Ze', 'https://example.com/avatars/john.jpg', '555-123-4567', 'Event enthusiast from LA', 0, 0, 1, 'email'),
('Jane Smith', 'jane@example.com', '$2a$10$xJwL5v5Jz5U5Z5U5Z5U5Ze', 'https://example.com/avatars/jane.jpg', '555-234-5678', 'Professional event planner', 1, 0, 1, 'email'),
('Mike Johnson', 'mike@example.com', '$2a$10$xJwL5v5Jz5U5Z5U5Z5U5Ze', 'https://example.com/avatars/mike.jpg', '555-345-6789', 'Wedding photographer', 1, 0, 1, 'google'),
('Sarah Williams', 'sarah@example.com', '$2a$10$xJwL5v5Jz5U5Z5U5Z5U5Ze', 'https://example.com/avatars/sarah.jpg', '555-456-7890', 'Corporate event specialist', 1, 0, 1, 'facebook'),
('Admin User', 'admin@example.com', '$2a$10$xJwL5v5Jz5U5Z5U5Z5U5Ze', 'https://example.com/avatars/admin.jpg', '555-000-0000', 'System administrator', 0, 1, 1, 'email');
GO

-- Insert vendor profiles
INSERT INTO VendorProfiles (UserID, BusinessName, BusinessDescription, BusinessPhone, BusinessEmail, Website, YearsInBusiness, LicenseNumber, InsuranceVerified, IsVerified, AverageResponseTime, ResponseRate)
VALUES
(2, 'Elegant Events Co.', 'Full-service event planning for weddings and corporate events', '555-987-6543', 'events@elegant.com', 'https://elegant-events.com', 8, 'LIC12345', 1, 1, 45, 0.85),
(3, 'Capture Moments Photography', 'Professional wedding and event photography', '555-876-5432', 'info@capturemoments.com', 'https://capturemoments.com', 5, 'PHO54321', 1, 1, 30, 0.90),
(4, 'Corporate Gatherings', 'Specialists in corporate event planning and execution', '555-765-4321', 'contact@corporategatherings.com', 'https://corporategatherings.com', 10, 'CORP98765', 1, 1, 60, 0.75);
GO

-- Insert vendor categories
INSERT INTO VendorCategories (VendorProfileID, Category)
VALUES
(1, 'venue'),
(1, 'planner'),
(2, 'photo'),
(3, 'planner'),
(3, 'venue');
GO

-- Insert vendor business hours
-- (0=Sunday, 1=Monday, etc.)
INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime)
VALUES
(1, 1, '09:00', '17:00'),
(1, 2, '09:00', '17:00'),
(1, 3, '09:00', '17:00'),
(1, 4, '09:00', '17:00'),
(1, 5, '09:00', '17:00'),
(2, 0, '10:00', '18:00'),
(2, 1, '10:00', '18:00'),
(2, 2, '10:00', '18:00'),
(2, 3, '10:00', '18:00'),
(2, 4, '10:00', '18:00'),
(2, 5, '10:00', '18:00'),
(2, 6, '10:00', '16:00'),
(3, 1, '08:00', '18:00'),
(3, 2, '08:00', '18:00'),
(3, 3, '08:00', '18:00'),
(3, 4, '08:00', '18:00'),
(3, 5, '08:00', '18:00');
GO

-- Insert vendor service areas
INSERT INTO VendorServiceAreas (VendorProfileID, City, State, Country, RadiusMiles)
VALUES
(1, 'Los Angeles', 'California', 'USA', 50),
(1, 'Orange County', 'California', 'USA', 30),
(2, 'Los Angeles', 'California', 'USA', 100),
(2, 'San Diego', 'California', 'USA', 100),
(3, 'Los Angeles', 'California', 'USA', 25),
(3, 'Ventura', 'California', 'USA', 25);
GO

-- Insert vendor portfolio items
INSERT INTO VendorPortfolio (VendorProfileID, Title, Description, ImageURL, ProjectDate)
VALUES
(1, 'Summer Wedding', 'Beautiful outdoor wedding at the beach', 'https://example.com/portfolio/wedding1.jpg', '2022-06-15'),
(1, 'Corporate Gala', 'Annual company gala for 200 guests', 'https://example.com/portfolio/gala1.jpg', '2022-11-20'),
(2, 'Sarah & Mike Wedding', 'Full wedding day coverage', 'https://example.com/portfolio/wedding2.jpg', '2023-01-10'),
(2, 'Baby Shower', 'Outdoor baby shower photography', 'https://example.com/portfolio/babyshower1.jpg', '2022-09-05'),
(3, 'Product Launch', 'Corporate product launch event', 'https://example.com/portfolio/launch1.jpg', '2023-02-15'),
(3, 'Awards Ceremony', 'Annual employee awards ceremony', 'https://example.com/portfolio/awards1.jpg', '2022-12-10');
GO

-- Insert vendor FAQs
INSERT INTO VendorFAQs (VendorProfileID, Question, Answer, DisplayOrder)
VALUES
(1, 'What types of events do you plan?', 'We specialize in weddings and corporate events, but can accommodate most event types.', 1),
(1, 'How far in advance should I book?', 'We recommend booking at least 6-12 months in advance for weddings, 3-6 months for corporate events.', 2),
(2, 'What is your photography style?', 'We use a natural, documentary style with some posed portraits.', 1),
(2, 'Do you provide edited photos?', 'Yes, all delivered photos are professionally edited.', 2),
(3, 'Can you handle large corporate events?', 'Yes, we have experience with events up to 1000 attendees.', 1),
(3, 'Do you provide AV equipment?', 'We can arrange AV equipment through our partners for an additional fee.', 2);
GO

-- Insert vendor team members
INSERT INTO VendorTeam (VendorProfileID, Name, Role, Bio, ImageURL, DisplayOrder)
VALUES
(1, 'Jane Smith', 'Lead Planner', 'With 10 years of experience, Jane specializes in wedding planning.', 'https://example.com/team/jane.jpg', 1),
(1, 'Robert Chen', 'Event Coordinator', 'Robert handles logistics and vendor coordination.', 'https://example.com/team/robert.jpg', 2),
(2, 'Mike Johnson', 'Lead Photographer', 'Mike has been photographing weddings for 8 years.', 'https://example.com/team/mike.jpg', 1),
(3, 'Sarah Williams', 'Event Director', 'Sarah oversees all corporate events.', 'https://example.com/team/sarah.jpg', 1),
(3, 'David Miller', 'Operations Manager', 'David handles logistics and staffing.', 'https://example.com/team/david.jpg', 2);
GO

-- Insert vendor social media
INSERT INTO VendorSocialMedia (VendorProfileID, Platform, URL, DisplayOrder)
VALUES
(1, 'Instagram', 'https://instagram.com/elegantevents', 1),
(1, 'Facebook', 'https://facebook.com/elegantevents', 2),
(2, 'Instagram', 'https://instagram.com/capturemoments', 1),
(3, 'LinkedIn', 'https://linkedin.com/company/corporategatherings', 1),
(3, 'Twitter', 'https://twitter.com/corp_gatherings', 2);
GO

-- Insert service categories
INSERT INTO ServiceCategories (VendorProfileID, Name, Description, DisplayOrder)
VALUES
(1, 'Wedding Packages', 'Complete packages for weddings', 1),
(1, 'Corporate Packages', 'Services for corporate events', 2),
(2, 'Photography', 'Photo session options', 1),
(2, 'Videography', 'Video recording services', 2),
(3, 'Event Planning', 'Corporate event planning', 1),
(3, 'Venue Services', 'Venue-related services', 2);
GO

-- Insert services
INSERT INTO Services (CategoryID, Name, Description, Price, DurationMinutes, MinDuration, MaxAttendees, RequiresDeposit, DepositPercentage, CancellationPolicy)
VALUES
(1, 'Basic Wedding Package', 'Includes planning, coordination, and day-of services', 5000.00, NULL, NULL, NULL, 1, 25.00, '50% refund if cancelled >90 days before, no refund after'),
(1, 'Premium Wedding Package', 'Full-service planning from start to finish', 8000.00, NULL, NULL, NULL, 1, 30.00, '25% refund if cancelled >120 days before, no refund after'),
(2, 'Corporate Conference', 'Full planning for corporate conferences', 10000.00, NULL, NULL, NULL, 1, 30.00, '50% refund if cancelled >60 days before'),
(3, 'Wedding Photography', '8 hours of wedding day coverage', 2500.00, 480, 480, NULL, 1, 50.00, 'Deposit non-refundable'),
(3, 'Engagement Session', '2 hour engagement photo session', 350.00, 120, 60, NULL, 1, 50.00, 'Deposit non-refundable'),
(4, 'Wedding Videography', 'Full day wedding video', 3000.00, 480, 480, NULL, 1, 50.00, 'Deposit non-refundable'),
(5, 'Corporate Event Planning', 'Complete planning for corporate events', 5000.00, NULL, NULL, NULL, 1, 30.00, '50% refund if cancelled >30 days before'),
(6, 'Venue Rental', 'Event venue rental', 2000.00, NULL, NULL, 100, 1, 50.00, 'Deposit non-refundable');
GO

-- Insert service add-ons
INSERT INTO ServiceAddOns (ServiceID, Name, Description, Price)
VALUES
(4, 'Additional Photographer', 'Second photographer for full coverage', 500.00),
(4, 'Photo Album', 'Premium leather-bound photo album', 300.00),
(6, 'Highlight Video', '3-5 minute highlight video', 500.00),
(7, 'AV Equipment', 'Audio-visual equipment rental', 1000.00),
(8, 'Catering Service', 'Basic catering package', 1500.00);
GO

-- Insert service images
INSERT INTO ServiceImages (ServiceID, ImageURL, IsPrimary, DisplayOrder)
VALUES
(1, 'https://example.com/services/wedding1.jpg', 1, 1),
(2, 'https://example.com/services/wedding2.jpg', 1, 1),
(3, 'https://example.com/services/corporate1.jpg', 1, 1),
(4, 'https://example.com/services/photography1.jpg', 1, 1),
(5, 'https://example.com/services/engagement1.jpg', 1, 1),
(6, 'https://example.com/services/videography1.jpg', 1, 1),
(7, 'https://example.com/services/planning1.jpg', 1, 1),
(8, 'https://example.com/services/venue1.jpg', 1, 1);
GO

-- Insert service availability exceptions
INSERT INTO ServiceAvailability (ServiceID, StartDateTime, EndDateTime, IsAvailable, Reason)
VALUES
(1, '2023-06-10 00:00', '2023-06-17 00:00', 0, 'Annual vacation'),
(4, '2023-05-20 00:00', '2023-05-21 00:00', 0, 'Booked for wedding'),
(8, '2023-07-04 00:00', '2023-07-05 00:00', 0, 'Holiday closure');
GO

-- Insert favorites
INSERT INTO Favorites (UserID, VendorProfileID)
VALUES
(1, 1),
(1, 2),
(2, 3),
(3, 1),
(4, 2);
GO

-- Insert bookings
INSERT INTO Bookings (UserID, VendorProfileID, ServiceID, BookingDate, EventDate, EndDate, Status, TotalAmount, DepositAmount, DepositPaid, FullAmountPaid, AttendeeCount)
VALUES
(1, 1, 1, '2022-12-15', '2023-06-20', '2023-06-21', 'confirmed', 5000.00, 1250.00, 1, 0, 100),
(1, 2, 4, '2023-01-10', '2023-06-20', '2023-06-20', 'confirmed', 2500.00, 1250.00, 1, 1, NULL),
(2, 3, 7, '2023-02-01', '2023-09-15', '2023-09-16', 'pending', 5000.00, 1500.00, 1, 0, 200),
(3, 1, 2, '2023-01-20', '2023-08-10', '2023-08-11', 'confirmed', 8000.00, 2400.00, 1, 0, 150),
(4, 2, 5, '2023-02-15', '2023-07-01', '2023-07-01', 'completed', 350.00, 175.00, 1, 1, NULL);
GO

-- Insert booking services
INSERT INTO BookingServices (BookingID, ServiceID, PriceAtBooking)
VALUES
(1, 1, 5000.00),
(2, 4, 2500.00),
(3, 7, 5000.00),
(4, 2, 8000.00),
(5, 5, 350.00);
GO

-- Insert booking timeline
INSERT INTO BookingTimeline (BookingID, Status, ChangedBy, Notes)
VALUES
(1, 'pending', 1, 'Booking created'),
(1, 'confirmed', 2, 'Booking confirmed by vendor'),
(2, 'pending', 1, 'Booking created'),
(2, 'confirmed', 3, 'Booking confirmed'),
(2, 'paid', 1, 'Full payment received'),
(3, 'pending', 2, 'Booking created'),
(4, 'pending', 3, 'Booking created'),
(4, 'confirmed', 2, 'Booking confirmed'),
(5, 'pending', 4, 'Booking created'),
(5, 'confirmed', 3, 'Booking confirmed'),
(5, 'paid', 4, 'Full payment received'),
(5, 'completed', 3, 'Service completed');
GO

-- Insert reviews
INSERT INTO Reviews (UserID, VendorProfileID, BookingID, Rating, Title, Comment, Response, IsApproved)
VALUES
(1, 1, 1, 5, 'Perfect wedding!', 'Jane and her team made our wedding day absolutely perfect. Everything went smoothly.', 'Thank you for your kind words! We loved working with you.', 1),
(4, 2, 5, 4, 'Great engagement photos', 'Mike did a wonderful job with our engagement photos. Only wish the session was a bit longer.', 'Thank you! We can certainly extend the session next time.', 1),
(3, 1, 4, 5, 'Excellent service', 'The team went above and beyond for our event. Highly recommend!', NULL, 1);
GO

-- Insert review media
INSERT INTO ReviewMedia (ReviewID, ImageURL)
VALUES
(1, 'https://example.com/reviews/wedding1.jpg'),
(2, 'https://example.com/reviews/engagement1.jpg');
GO

-- Insert conversations
INSERT INTO Conversations (UserID, VendorProfileID, BookingID, Subject, LastMessageAt)
VALUES
(1, 1, 1, 'Wedding Booking #1', '2023-02-20'),
(1, 2, 2, 'Photography Booking #2', '2023-02-15'),
(2, 3, 3, 'Corporate Event #3', '2023-02-18'),
(3, 1, 4, 'Wedding Booking #4', '2023-02-10'),
(4, 2, 5, 'Engagement Session #5', '2023-02-05');
GO

-- Insert messages
INSERT INTO Messages (ConversationID, SenderID, Content, IsRead)
VALUES
(1, 1, 'Hi Jane, I have some questions about the wedding package.', 1),
(1, 2, 'Of course! What would you like to know?', 1),
(1, 1, 'Can we customize the floral arrangements?', 1),
(2, 1, 'Hi Mike, what time will you arrive on the wedding day?', 1),
(2, 3, 'I typically arrive 2 hours before the ceremony start time.', 1),
(3, 2, 'Hello Sarah, we need to discuss the corporate event agenda.', 0),
(4, 3, 'Hi Jane, can we add a rehearsal dinner to our package?', 1),
(5, 4, 'Mike, can we reschedule our engagement session?', 1);
GO

-- Insert notifications
INSERT INTO Notifications (UserID, Type, Title, Message, IsRead, RelatedID, RelatedType, ActionURL)
VALUES
(1, 'booking', 'Booking Confirmed', 'Your wedding booking has been confirmed', 1, 1, 'booking', '/bookings/1'),
(1, 'message', 'New Message', 'You have a new message from Elegant Events Co.', 1, 1, 'message', '/messages/1'),
(2, 'booking', 'New Booking', 'You have a new booking request', 0, 3, 'booking', '/vendor/bookings/3'),
(3, 'review', 'New Review', 'You have received a new 5-star review', 1, 3, 'review', '/vendor/reviews'),
(4, 'booking', 'Payment Received', 'Payment for your booking has been processed', 1, 5, 'booking', '/bookings/5');
GO

-- Insert payment methods
INSERT INTO PaymentMethods (UserID, StripePaymentMethodID, IsDefault, CardBrand, Last4, ExpMonth, ExpYear)
VALUES
(1, 'pm_123456789', 1, 'visa', '4242', 12, 2025),
(2, 'pm_987654321', 1, 'mastercard', '1881', 6, 2024),
(3, 'pm_456789123', 1, 'amex', '1001', 3, 2026);
GO

-- Insert transactions
INSERT INTO Transactions (UserID, VendorProfileID, BookingID, Amount, FeeAmount, NetAmount, Description, StripeChargeID, Status)
VALUES
(1, 1, 1, 1250.00, 50.00, 1200.00, 'Deposit for Wedding Booking', 'ch_123456789', 'succeeded'),
(1, 2, 2, 1250.00, 50.00, 1200.00, 'Deposit for Photography', 'ch_234567891', 'succeeded'),
(1, 2, 2, 1250.00, 50.00, 1200.00, 'Final Payment for Photography', 'ch_345678912', 'succeeded'),
(4, 2, 5, 175.00, 5.00, 170.00, 'Deposit for Engagement Session', 'ch_456789123', 'succeeded'),
(4, 2, 5, 175.00, 5.00, 170.00, 'Final Payment for Engagement Session', 'ch_567891234', 'succeeded');
GO

-- ======================
-- TEST THE PROCEDURES
-- ======================

-- Search vendors
EXEC sp_SearchVendors @Category = 'venue', @MinRating = 4.5;
GO

-- Get vendor details
EXEC sp_GetVendorDetails @VendorProfileID = 1;
GO

-- Get service availability
EXEC sp_GetServiceAvailability @ServiceID = 1, @StartDate = '2023-06-01', @EndDate = '2023-06-30';
GO

-- Create booking
EXEC sp_CreateBooking 
    @UserID = 1,
    @ServiceID = 3,
    @EventDate = '2023-10-15 10:00',
    @EndDate = '2023-10-15 18:00',
    @AttendeeCount = 150;
GO

-- Update booking status
EXEC sp_UpdateBookingStatus 
    @BookingID = 3,
    @Status = 'confirmed',
    @UserID = 4,
    @Notes = 'Confirmed after reviewing details';
GO

-- Add review
EXEC sp_AddReview
    @UserID = 1,
    @VendorProfileID = 2,
    @BookingID = 2,
    @Rating = 5,
    @Title = 'Amazing photos!',
    @Comment = 'The photos turned out even better than we imagined!';
GO

-- Send message
EXEC sp_SendMessage
    @ConversationID = 1,
    @SenderID = 1,
    @Content = 'Can we schedule a meeting to go over the details?';
GO

-- Get user dashboard
EXEC sp_GetUserDashboard @UserID = 1;
GO

-- Get vendor dashboard
EXEC sp_GetVendorDashboard @UserID = 2;
GO
