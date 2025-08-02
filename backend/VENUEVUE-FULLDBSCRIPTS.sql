-- VenueVue Database Setup for Microsoft SQL Server
-- Complete script with simplified search procedure

-- ======================
-- TABLES
-- ======================

CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Avatar NVARCHAR(10),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    AuthProvider NVARCHAR(20) DEFAULT 'email'
);
GO

CREATE TABLE Vendors (
    VendorID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    Category NVARCHAR(50) NOT NULL,
    Location NVARCHAR(255) NOT NULL,
    Latitude DECIMAL(10, 8),
    Longitude DECIMAL(11, 8),
    PriceLevel NVARCHAR(5) DEFAULT '$',
    Rating DECIMAL(2, 1) DEFAULT 0.0,
    ReviewCount INT DEFAULT 0,
    IsPremium BIT DEFAULT 0,
    IsEcoFriendly BIT DEFAULT 0,
    IsAwardWinning BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);
GO

CREATE TABLE VendorImages (
    ImageID INT PRIMARY KEY IDENTITY(1,1),
    VendorID INT FOREIGN KEY REFERENCES Vendors(VendorID),
    ImageURL NVARCHAR(255) NOT NULL,
    IsPrimary BIT DEFAULT 0,
    UploadedAt DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE ServiceCategories (
    CategoryID INT PRIMARY KEY IDENTITY(1,1),
    VendorID INT FOREIGN KEY REFERENCES Vendors(VendorID),
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    DisplayOrder INT DEFAULT 0
);
GO

CREATE TABLE Services (
    ServiceID INT PRIMARY KEY IDENTITY(1,1),
    CategoryID INT FOREIGN KEY REFERENCES ServiceCategories(CategoryID),
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(10, 2) NOT NULL,
    DurationMinutes INT,
    IsActive BIT DEFAULT 1
);
GO

CREATE TABLE Favorites (
    FavoriteID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    VendorID INT FOREIGN KEY REFERENCES Vendors(VendorID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT UC_Favorite UNIQUE (UserID, VendorID)
);
GO

CREATE TABLE Bookings (
    BookingID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    VendorID INT FOREIGN KEY REFERENCES Vendors(VendorID),
    BookingDate DATETIME NOT NULL,
    EventDate DATETIME NOT NULL,
    Status NVARCHAR(20) DEFAULT 'pending',
    TotalAmount DECIMAL(10, 2),
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE BookingServices (
    BookingServiceID INT PRIMARY KEY IDENTITY(1,1),
    BookingID INT FOREIGN KEY REFERENCES Bookings(BookingID),
    ServiceID INT FOREIGN KEY REFERENCES Services(ServiceID),
    Quantity INT DEFAULT 1,
    PriceAtBooking DECIMAL(10, 2) NOT NULL
);
GO

CREATE TABLE Reviews (
    ReviewID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    VendorID INT FOREIGN KEY REFERENCES Vendors(VendorID),
    BookingID INT FOREIGN KEY REFERENCES Bookings(BookingID),
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    IsApproved BIT DEFAULT 0
);
GO

CREATE TABLE Notifications (
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Title NVARCHAR(100) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Link NVARCHAR(255)
);
GO

-- ======================
-- FUNCTIONS
-- ======================

CREATE FUNCTION dbo.GetVendorRating(@VendorID INT)
RETURNS DECIMAL(2, 1)
AS
BEGIN
    DECLARE @Rating DECIMAL(2, 1)
    
    SELECT @Rating = AVG(CAST(Rating AS DECIMAL(2, 1)))
    FROM Reviews
    WHERE VendorID = @VendorID AND IsApproved = 1
    
    RETURN ISNULL(@Rating, 0.0)
END;
GO

-- ======================
-- STORED PROCEDURES
-- ======================

CREATE OR ALTER PROCEDURE sp_UpdateVendorRating
    @VendorID INT
AS
BEGIN
    DECLARE @AvgRating DECIMAL(2, 1)
    DECLARE @ReviewCount INT
    
    SELECT 
        @AvgRating = AVG(CAST(Rating AS DECIMAL(2, 1))),
        @ReviewCount = COUNT(*)
    FROM Reviews
    WHERE VendorID = @VendorID AND IsApproved = 1
    
    UPDATE Vendors
    SET 
        Rating = ISNULL(@AvgRating, 0.0),
        ReviewCount = ISNULL(@ReviewCount, 0)
    WHERE VendorID = @VendorID
END;
GO

-- SIMPLIFIED SEARCH PROCEDURE (NO PAGINATION)
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
    
    SELECT 
        v.VendorID,
        v.Name,
        v.Description,
        v.Category,
        v.Location,
        v.Latitude,
        v.Longitude,
        v.PriceLevel,
        v.Rating,
        v.ReviewCount,
        v.IsPremium,
        v.IsEcoFriendly,
        v.IsAwardWinning,
        u.Name AS OwnerName,
        (SELECT COUNT(*) FROM Favorites f WHERE f.VendorID = v.VendorID) AS FavoriteCount,
        (SELECT TOP 1 ImageURL FROM VendorImages WHERE VendorID = v.VendorID AND IsPrimary = 1) AS PrimaryImage
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

-- ======================
-- VIEWS
-- ======================

CREATE VIEW vw_VendorDetails AS
SELECT 
    v.VendorID,
    v.Name,
    v.Description,
    v.Category,
    v.Location,
    v.Latitude,
    v.Longitude,
    v.PriceLevel,
    v.Rating,
    v.ReviewCount,
    v.IsPremium,
    v.IsEcoFriendly,
    v.IsAwardWinning,
    u.UserID AS OwnerID,
    u.Name AS OwnerName,
    (SELECT COUNT(*) FROM Favorites f WHERE f.VendorID = v.VendorID) AS FavoriteCount,
    (SELECT TOP 1 ImageURL FROM VendorImages WHERE VendorID = v.VendorID AND IsPrimary = 1) AS PrimaryImage
FROM Vendors v
JOIN Users u ON v.UserID = u.UserID
WHERE v.IsActive = 1;
GO

CREATE VIEW vw_VendorServices AS
SELECT 
    s.ServiceID,
    s.Name AS ServiceName,
    s.Description,
    s.Price,
    s.DurationMinutes,
    sc.CategoryID,
    sc.Name AS CategoryName,
    sc.VendorID,
    v.Name AS VendorName,
    v.Category AS VendorCategory
FROM Services s
JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
JOIN Vendors v ON sc.VendorID = v.VendorID
WHERE s.IsActive = 1 AND v.IsActive = 1;
GO

CREATE VIEW vw_UserFavorites AS
SELECT 
    f.FavoriteID,
    f.UserID,
    f.VendorID,
    v.Name AS VendorName,
    v.Category AS VendorCategory,
    v.Location,
    v.Rating,
    v.PriceLevel,
    (SELECT TOP 1 ImageURL FROM VendorImages WHERE VendorID = v.VendorID AND IsPrimary = 1) AS PrimaryImage
FROM Favorites f
JOIN Vendors v ON f.VendorID = v.VendorID
WHERE v.IsActive = 1;
GO

-- ======================
-- TEST DATA
-- ======================

-- Insert test users
INSERT INTO Users (Name, Email, PasswordHash, Avatar, AuthProvider)
VALUES 
('John Doe', 'john@example.com', '$2a$10$xJwL5v5Jz5U5Z5U5Z5U5Ze', 'J', 'email'),
('Jane Smith', 'jane@example.com', '$2a$10$xJwL5v5Jz5U5Z5U5Z5U5Ze', 'J', 'email'),
('Mike Johnson', 'mike@example.com', '$2a$10$xJwL5v5Jz5U5Z5U5Z5U5Ze', 'M', 'google'),
('Sarah Williams', 'sarah@example.com', '$2a$10$xJwL5v5Jz5U5Z5U5Z5U5Ze', 'S', 'facebook');
GO

-- Insert test vendors
INSERT INTO Vendors (UserID, Name, Description, Category, Location, Latitude, Longitude, PriceLevel, IsPremium, IsEcoFriendly, IsAwardWinning)
VALUES
(1, 'Grand Ballroom', 'Elegant venue for weddings and corporate events', 'venue', '123 Main St, Los Angeles, CA', 34.052235, -118.243683, '$$$', 1, 0, 1),
(2, 'Capture Moments', 'Professional photography for all occasions', 'photo', '456 Oak Ave, Beverly Hills, CA', 34.067591, -118.397709, '$$', 0, 1, 0),
(3, 'DJ Sounds', 'Top-rated DJ for weddings and parties', 'music', '789 Sunset Blvd, Hollywood, CA', 34.097740, -118.331640, '$$', 1, 0, 1),
(4, 'Gourmet Delights', 'Premium catering service', 'catering', '321 Food St, Santa Monica, CA', 34.019455, -118.491191, '$$$', 1, 1, 1),
(1, 'Floral Designs', 'Beautiful flower arrangements', 'decor', '654 Garden Rd, Pasadena, CA', 34.147785, -118.144515, '$$', 0, 1, 0),
(3, 'Luxury Limos', 'Premium transportation services', 'transport', '987 Drive Ave, Long Beach, CA', 33.770050, -118.193739, '$$$', 1, 0, 0);
GO

-- Update ratings for vendors
UPDATE Vendors SET Rating = 4.8, ReviewCount = 25 WHERE VendorID = 1;
UPDATE Vendors SET Rating = 4.5, ReviewCount = 18 WHERE VendorID = 2;
UPDATE Vendors SET Rating = 4.9, ReviewCount = 32 WHERE VendorID = 3;
UPDATE Vendors SET Rating = 4.7, ReviewCount = 21 WHERE VendorID = 4;
UPDATE Vendors SET Rating = 4.2, ReviewCount = 12 WHERE VendorID = 5;
UPDATE Vendors SET Rating = 4.6, ReviewCount = 15 WHERE VendorID = 6;
GO

-- Insert vendor images
INSERT INTO VendorImages (VendorID, ImageURL, IsPrimary)
VALUES
(1, 'https://example.com/images/ballroom1.jpg', 1),
(1, 'https://example.com/images/ballroom2.jpg', 0),
(2, 'https://example.com/images/photography1.jpg', 1),
(3, 'https://example.com/images/dj1.jpg', 1),
(4, 'https://example.com/images/catering1.jpg', 1),
(5, 'https://example.com/images/floral1.jpg', 1),
(6, 'https://example.com/images/limo1.jpg', 1);
GO

-- Insert service categories
INSERT INTO ServiceCategories (VendorID, Name, Description, DisplayOrder)
VALUES
(1, 'Wedding Packages', 'Complete packages for weddings', 1),
(1, 'Corporate Events', 'Services for corporate gatherings', 2),
(2, 'Photography', 'Professional photo sessions', 1),
(2, 'Videography', 'Video recording services', 2),
(3, 'DJ Services', 'Music for events', 1),
(4, 'Catering Packages', 'Food service options', 1),
(5, 'Flower Arrangements', 'Custom floral designs', 1),
(6, 'Transportation', 'Vehicle services', 1);
GO

-- Insert services
INSERT INTO Services (CategoryID, Name, Description, Price, DurationMinutes)
VALUES
(1, 'Wedding Package A', 'Basic wedding package', 5000.00, 480),
(1, 'Wedding Package B', 'Premium wedding package', 8000.00, 600),
(2, 'Corporate Half-Day', 'Half-day corporate event', 3000.00, 240),
(3, 'Photo Session', '2-hour photo session', 350.00, 120),
(4, 'Wedding Video', 'Full wedding video coverage', 1200.00, 480),
(5, 'Wedding DJ', 'Music for wedding reception', 1000.00, 360),
(6, 'Buffet Service', 'Per person buffet', 45.00, NULL),
(7, 'Bridal Bouquet', 'Custom bridal bouquet', 150.00, NULL),
(8, 'Limo 4 Hours', 'Limo service for 4 hours', 400.00, 240);
GO

-- Insert favorites
INSERT INTO Favorites (UserID, VendorID)
VALUES
(1, 2),
(1, 4),
(2, 1),
(2, 3),
(3, 5),
(4, 6);
GO

-- Insert bookings
INSERT INTO Bookings (UserID, VendorID, BookingDate, EventDate, Status, TotalAmount, Notes)
VALUES
(1, 1, '2023-01-15', '2023-06-20', 'confirmed', 5000.00, 'Wedding ceremony'),
(2, 3, '2023-02-10', '2023-07-15', 'confirmed', 1000.00, 'Birthday party DJ'),
(3, 4, '2023-03-05', '2023-08-10', 'pending', 1350.00, 'Corporate lunch for 30 people');
GO

-- Insert booking services
INSERT INTO BookingServices (BookingID, ServiceID, PriceAtBooking)
VALUES
(1, 1, 5000.00),
(2, 6, 1000.00),
(3, 7, 45.00),
(3, 7, 45.00),
(3, 7, 45.00);
GO

-- Insert reviews
INSERT INTO Reviews (UserID, VendorID, BookingID, Rating, Comment, IsApproved)
VALUES
(1, 1, 1, 5, 'Perfect venue for our wedding!', 1),
(2, 3, 2, 4, 'Great music but started a bit late', 1),
(3, 4, 3, 5, 'Excellent food and service', 1);
GO

-- Insert notifications
INSERT INTO Notifications (UserID, Title, Message, Link)
VALUES
(1, 'Booking Confirmed', 'Your booking with Grand Ballroom has been confirmed', '/bookings/1'),
(2, 'New Review', 'You have a new review from John Doe', '/reviews'),
(3, 'Payment Received', 'Payment for your booking has been processed', '/bookings/3');
GO

-- ======================
-- TEST THE SEARCH PROCEDURE
-- ======================

-- Get all vendors
EXEC sp_SearchVendors;
GO

-- Get all premium venues
EXEC sp_SearchVendors 
    @Category = 'venue',
    @IsPremium = 1;
GO

-- Search for vendors with "wedding" in name/description
EXEC sp_SearchVendors 
    @SearchTerm = 'wedding';
GO
