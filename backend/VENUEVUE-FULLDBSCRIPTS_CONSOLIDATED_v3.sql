-- ======================
-- TABLES
-- ======================

-- Users table with enhanced fields
-- Note: isVendor is now a core flag on the user.
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255), -- Nullable for social logins
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
-- This table stores all the multi-step registration data.
CREATE TABLE VendorProfiles (
    VendorProfileID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID) UNIQUE,
    BusinessName NVARCHAR(100),
    DisplayName NVARCHAR(100), -- New field for display name
    BusinessDescription NVARCHAR(MAX),
    Tagline NVARCHAR(255), -- New field
    BusinessPhone NVARCHAR(20),
    BusinessEmail NVARCHAR(100),
    Website NVARCHAR(255),
    YearsInBusiness INT,
    LicenseNumber NVARCHAR(50),
    InsuranceVerified BIT DEFAULT 0,
    IsPremium BIT DEFAULT 0,
    IsEcoFriendly BIT DEFAULT 0,
    IsAwardWinning BIT DEFAULT 0,
    Status NVARCHAR(20) DEFAULT 'pending',
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Vendor categories
CREATE TABLE VendorCategories (
    VendorCategoryID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID) ON DELETE CASCADE,
    Category NVARCHAR(50)
);
GO

-- Vendor services
CREATE TABLE VendorServices (
    ServiceID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID) ON DELETE CASCADE,
    ServiceName NVARCHAR(100),
    Description NVARCHAR(MAX),
    Price DECIMAL(10, 2),
    PriceType NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Vendor locations
CREATE TABLE VendorLocations (
    LocationID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID) ON DELETE CASCADE,
    Address NVARCHAR(255),
    City NVARCHAR(100),
    State NVARCHAR(50),
    Country NVARCHAR(50),
    PostalCode NVARCHAR(20),
    Latitude DECIMAL(10, 8),
    Longitude DECIMAL(11, 8),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Gallery images
CREATE TABLE GalleryImages (
    ImageID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID) ON DELETE CASCADE,
    ImageUrl NVARCHAR(255),
    Caption NVARCHAR(255),
    IsFeatured BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Bookings table
CREATE TABLE Bookings (
    BookingID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    EventDate DATETIME,
    EndDate DATETIME,
    AttendeeCount INT,
    SpecialRequests NVARCHAR(MAX),
    Status NVARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    PaymentIntentID NVARCHAR(100)
);
GO

-- Booking services (for many-to-many relationship)
CREATE TABLE BookingServices (
    BookingServiceID INT PRIMARY KEY IDENTITY(1,1),
    BookingID INT FOREIGN KEY REFERENCES Bookings(BookingID) ON DELETE CASCADE,
    ServiceID INT FOREIGN KEY REFERENCES VendorServices(ServiceID),
    ServicePrice DECIMAL(10, 2)
);
GO

-- Conversations for chat
CREATE TABLE Conversations (
    ConversationID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Chat messages
CREATE TABLE Messages (
    MessageID INT PRIMARY KEY IDENTITY(1,1),
    ConversationID INT FOREIGN KEY REFERENCES Conversations(ConversationID) ON DELETE CASCADE,
    SenderID INT FOREIGN KEY REFERENCES Users(UserID),
    Content NVARCHAR(MAX),
    IsRead BIT DEFAULT 0,
    SentAt DATETIME DEFAULT GETDATE()
);
GO

-- Notifications
CREATE TABLE Notifications (
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Content NVARCHAR(MAX),
    Type NVARCHAR(50),
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Link NVARCHAR(255)
);
GO

-- Vendor availability exceptions (for blocking off dates)
CREATE TABLE VendorAvailabilityExceptions (
    ExceptionID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID) ON DELETE CASCADE,
    ExceptionDate DATE,
    StartTime TIME,
    EndTime TIME,
    IsAvailable BIT, -- 0 for unavailable, 1 for available
    Reason NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- User favorites (NEW)
CREATE TABLE UserFavorites (
    FavoriteID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UNIQUE (UserID, VendorProfileID)
);
GO

-- Reviews (NEW)
CREATE TABLE Reviews (
    ReviewID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    Rating INT CHECK (Rating >= 1 AND Rating <= 5),
    Comment NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UNIQUE (UserID, VendorProfileID)
);
GO

-- ======================
-- STORED PROCEDURES
-- ======================

-- User Registration
CREATE OR ALTER PROCEDURE sp_RegisterUser
    @Name NVARCHAR(100),
    @Email NVARCHAR(100),
    @PasswordHash NVARCHAR(255),
    @IsVendor BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @NewUserID INT;

    INSERT INTO Users (Name, Email, PasswordHash, IsVendor, CreatedAt, UpdatedAt)
    VALUES (@Name, @Email, @PasswordHash, @IsVendor, GETDATE(), GETDATE());

    SET @NewUserID = SCOPE_IDENTITY();

    -- If the user is a vendor, create a vendor profile
    IF @IsVendor = 1
    BEGIN
        INSERT INTO VendorProfiles (UserID)
        VALUES (@NewUserID);
    END
    
    SELECT @NewUserID AS UserID;
END;
GO

-- User Login
CREATE OR ALTER PROCEDURE sp_LoginUser
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Users
    SET LastLogin = GETDATE()
    WHERE Email = @Email;

    SELECT 
        UserID,
        Name,
        Email,
        PasswordHash,
        IsVendor,
        IsAdmin,
        Avatar,
        Phone,
        Bio,
        EmailVerified,
        StripeCustomerID
    FROM Users
    WHERE Email = @Email;
END;
GO

-- Update user profile
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

-- Update user password
CREATE OR ALTER PROCEDURE sp_UpdateUserPassword
    @UserID INT,
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Users
    SET PasswordHash = @PasswordHash, UpdatedAt = GETDATE()
    WHERE UserID = @UserID;

    SELECT 1 AS Success;
END;
GO

-- Update user location
CREATE OR ALTER PROCEDURE sp_UpdateUserLocation
    @UserID INT,
    @Latitude DECIMAL(10, 8) = NULL,
    @Longitude DECIMAL(11, 8) = NULL,
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(50) = NULL,
    @Country NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM UserLocations WHERE UserID = @UserID)
    BEGIN
        INSERT INTO UserLocations (UserID, Latitude, Longitude, City, State, Country)
        VALUES (@UserID, @Latitude, @Longitude, @City, @State, @Country);
    END
    ELSE
    BEGIN
        UPDATE UserLocations
        SET 
            Latitude = ISNULL(@Latitude, Latitude),
            Longitude = ISNULL(@Longitude, Longitude),
            City = ISNULL(@City, City),
            State = ISNULL(@State, State),
            Country = ISNULL(@Country, Country),
            UpdatedAt = GETDATE()
        WHERE UserID = @UserID;
    END

    SELECT SCOPE_IDENTITY() AS LocationID;
END;
GO

-- Search vendors
CREATE OR ALTER PROCEDURE sp_SearchVendors
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
    @SortBy NVARCHAR(50) = 'Relevance'
AS
BEGIN
    SET NOCOUNT ON;

    -- Complex search logic would go here
    -- For now, a simplified search
    SELECT VP.*, U.Name AS UserName
    FROM VendorProfiles VP
    JOIN Users U ON VP.UserID = U.UserID
    WHERE (@SearchTerm IS NULL OR VP.BusinessName LIKE '%' + @SearchTerm + '%' OR VP.BusinessDescription LIKE '%' + @SearchTerm + '%')
    AND (@Category IS NULL OR VP.VendorProfileID IN (SELECT VendorProfileID FROM VendorCategories WHERE Category = @Category))
    AND (@IsPremium IS NULL OR VP.IsPremium = @IsPremium)
    AND (@IsEcoFriendly IS NULL OR VP.IsEcoFriendly = @IsEcoFriendly)
    AND (@IsAwardWinning IS NULL OR VP.IsAwardWinning = @IsAwardWinning)
    ORDER BY
        CASE WHEN @SortBy = 'Rating' THEN (SELECT AVG(CAST(Rating AS DECIMAL(10,2))) FROM Reviews WHERE VendorProfileID = VP.VendorProfileID) END DESC,
        CASE WHEN @SortBy = 'Relevance' THEN VP.VendorProfileID END -- Placeholder for relevance
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- Get vendor details
CREATE OR ALTER PROCEDURE sp_GetVendorDetails
    @VendorProfileID INT,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Main profile info
    SELECT VP.*, U.Name AS UserName, U.Email, U.Phone, U.Bio
    FROM VendorProfiles VP
    JOIN Users U ON VP.UserID = U.UserID
    WHERE VP.VendorProfileID = @VendorProfileID;

    -- Categories
    SELECT Category FROM VendorCategories WHERE VendorProfileID = @VendorProfileID;

    -- Services
    SELECT ServiceName, Description, Price, PriceType FROM VendorServices WHERE VendorProfileID = @VendorProfileID;

    -- Gallery Images
    SELECT ImageUrl, Caption, IsFeatured FROM GalleryImages WHERE VendorProfileID = @VendorProfileID;

    -- Reviews
    SELECT R.Rating, R.Comment, U.Name AS ReviewerName, R.CreatedAt
    FROM Reviews R
    JOIN Users U ON R.UserID = U.UserID
    WHERE R.VendorProfileID = @VendorProfileID
    ORDER BY R.CreatedAt DESC;

    -- Favorites status (check if current user has favorited)
    SELECT
        CAST(
            CASE WHEN EXISTS (SELECT 1 FROM UserFavorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID)
            THEN 1 ELSE 0 END
        AS BIT) AS IsFavorite;
END;
GO

-- Update vendor profile from step 1 (Business Info)
CREATE OR ALTER PROCEDURE sp_UpdateVendorProfileBusiness
    @VendorProfileID INT,
    @BusinessName NVARCHAR(100),
    @DisplayName NVARCHAR(100),
    @BusinessPhone NVARCHAR(20),
    @BusinessEmail NVARCHAR(100),
    @Website NVARCHAR(255),
    @Categories NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE VendorProfiles
    SET BusinessName = @BusinessName,
        DisplayName = @DisplayName,
        BusinessPhone = @BusinessPhone,
        BusinessEmail = @BusinessEmail,
        Website = @Website,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;

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

-- Update Vendor Profile from Step 2 (Location Info)
CREATE OR ALTER PROCEDURE sp_UpdateVendorProfileLocation
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

-- Update Vendor Profile from Step 3 (About)
CREATE OR ALTER PROCEDURE sp_UpdateVendorProfileAbout
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

-- Toggle favorite status (NEW)
CREATE OR ALTER PROCEDURE sp_ToggleFavorite
    @UserID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IsFavorited BIT;
    
    IF EXISTS (SELECT 1 FROM UserFavorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID)
    BEGIN
        DELETE FROM UserFavorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID;
        SET @IsFavorited = 0;
    END
    ELSE
    BEGIN
        INSERT INTO UserFavorites (UserID, VendorProfileID)
        VALUES (@UserID, @VendorProfileID);
        SET @IsFavorited = 1;
    END
    
    SELECT @IsFavorited AS IsFavorited;
END;
GO

-- Submit a new review (NEW)
CREATE OR ALTER PROCEDURE sp_SubmitReview
    @UserID INT,
    @VendorProfileID INT,
    @Rating INT,
    @Comment NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if the user has already reviewed this vendor
    IF EXISTS (SELECT 1 FROM Reviews WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID)
    BEGIN
        -- Update existing review
        UPDATE Reviews
        SET Rating = @Rating, Comment = @Comment, CreatedAt = GETDATE()
        WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID;
    END
    ELSE
    BEGIN
        -- Insert a new review
        INSERT INTO Reviews (UserID, VendorProfileID, Rating, Comment)
        VALUES (@UserID, @VendorProfileID, @Rating, @Comment);
    END
    
    SELECT 1 AS Success;
END;
GO

-- Get vendor dashboard data (NEW)
CREATE OR ALTER PROCEDURE sp_GetVendorDashboard
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @VendorProfileID INT;
    SELECT @VendorProfileID = VendorProfileID FROM VendorProfiles WHERE UserID = @UserID;

    -- If no vendor profile exists, return empty result sets
    IF @VendorProfileID IS NULL
    BEGIN
        SELECT NULL AS Profile, NULL AS RecentBookings, NULL AS RecentReviews, NULL AS UnreadMessages, NULL AS UnreadNotifications, NULL AS Stats;
        RETURN;
    END

    -- Profile summary
    SELECT
        VP.BusinessName,
        VP.DisplayName,
        VP.Status,
        U.Name,
        U.Email,
        (SELECT COUNT(*) FROM Reviews WHERE VendorProfileID = VP.VendorProfileID) AS TotalReviews,
        (SELECT AVG(CAST(Rating AS DECIMAL(10,2))) FROM Reviews WHERE VendorProfileID = VP.VendorProfileID) AS AverageRating
    FROM VendorProfiles VP
    JOIN Users U ON VP.UserID = U.UserID
    WHERE VP.VendorProfileID = @VendorProfileID;

    -- Recent bookings
    SELECT
        B.BookingID,
        U.Name AS UserName,
        B.EventDate,
        B.Status
    FROM Bookings B
    JOIN Users U ON B.UserID = U.UserID
    WHERE B.VendorProfileID = @VendorProfileID
    ORDER BY B.CreatedAt DESC
    OFFSET 0 ROWS
    FETCH NEXT 5 ROWS ONLY;

    -- Recent reviews
    SELECT
        R.Rating,
        R.Comment,
        U.Name AS ReviewerName,
        R.CreatedAt
    FROM Reviews R
    JOIN Users U ON R.UserID = U.UserID
    WHERE R.VendorProfileID = @VendorProfileID
    ORDER BY R.CreatedAt DESC
    OFFSET 0 ROWS
    FETCH NEXT 5 ROWS ONLY;

    -- Unread messages
    SELECT COUNT(M.MessageID) AS UnreadMessages
    FROM Messages M
    JOIN Conversations C ON M.ConversationID = C.ConversationID
    WHERE (C.UserID = @UserID OR C.VendorProfileID = @VendorProfileID) AND M.IsRead = 0 AND M.SenderID <> @UserID;
    
    -- Unread notifications
    SELECT COUNT(NotificationID) AS UnreadNotifications
    FROM Notifications
    WHERE UserID = @UserID AND IsRead = 0;

    -- Stats summary
    SELECT
        (SELECT COUNT(*) FROM Bookings WHERE VendorProfileID = @VendorProfileID AND Status = 'pending') AS PendingBookings,
        (SELECT COUNT(*) FROM Bookings WHERE VendorProfileID = @VendorProfileID AND Status = 'confirmed') AS ConfirmedBookings,
        (SELECT COUNT(*) FROM Bookings WHERE VendorProfileID = @VendorProfileID) AS TotalBookings;
END;
GO

-- Create a booking with services
CREATE OR ALTER PROCEDURE sp_CreateBookingWithServices
    @UserID INT,
    @VendorProfileID INT,
    @EventDate DATETIME,
    @EndDate DATETIME = NULL,
    @AttendeeCount INT = NULL,
    @SpecialRequests NVARCHAR(MAX) = NULL,
    @ServicesJSON NVARCHAR(MAX) = NULL,
    @PaymentIntentID NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @BookingID INT;
    DECLARE @ConversationID INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Create the booking
        INSERT INTO Bookings (UserID, VendorProfileID, EventDate, EndDate, AttendeeCount, SpecialRequests, PaymentIntentID, Status)
        VALUES (@UserID, @VendorProfileID, @EventDate, @EndDate, @AttendeeCount, @SpecialRequests, @PaymentIntentID, 'pending');
        SET @BookingID = SCOPE_IDENTITY();

        -- 2. Add services if provided
        IF @ServicesJSON IS NOT NULL
        BEGIN
            INSERT INTO BookingServices (BookingID, ServiceID, ServicePrice)
            SELECT @BookingID, s.ServiceID, s.Price
            FROM OPENJSON(@ServicesJSON)
            WITH (
                ServiceID INT '$.serviceId'
            ) AS services
            JOIN VendorServices s ON services.ServiceID = s.ServiceID;
        END

        -- 3. Create or get existing conversation
        SELECT @ConversationID = ConversationID
        FROM Conversations
        WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID;

        IF @ConversationID IS NULL
        BEGIN
            INSERT INTO Conversations (UserID, VendorProfileID)
            VALUES (@UserID, @VendorProfileID);
            SET @ConversationID = SCOPE_IDENTITY();
        END

        COMMIT TRANSACTION;

        -- Return the new booking and conversation IDs
        SELECT @BookingID AS BookingID, @ConversationID AS ConversationID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- Confirm booking payment
CREATE OR ALTER PROCEDURE sp_ConfirmBookingPayment
    @BookingID INT,
    @PaymentIntentID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Bookings
    SET Status = 'confirmed',
        PaymentIntentID = @PaymentIntentID
    WHERE BookingID = @BookingID;
    
    SELECT 1 AS Success;
END;
GO

-- Upsert Vendor Availability Exception
CREATE OR ALTER PROCEDURE sp_UpsertVendorAvailabilityException
    @ExceptionID INT = NULL,
    @VendorProfileID INT,
    @ExceptionDate DATE,
    @StartTime TIME = NULL,
    @EndTime TIME = NULL,
    @IsAvailable BIT,
    @Reason NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @ExceptionID IS NULL OR NOT EXISTS (SELECT 1 FROM VendorAvailabilityExceptions WHERE ExceptionID = @ExceptionID)
    BEGIN
        INSERT INTO VendorAvailabilityExceptions (VendorProfileID, ExceptionDate, StartTime, EndTime, IsAvailable, Reason)
        VALUES (@VendorProfileID, @ExceptionDate, @StartTime, @EndTime, @IsAvailable, @Reason);
        
        SELECT SCOPE_IDENTITY() AS ExceptionID;
    END
    ELSE
    BEGIN
        UPDATE VendorAvailabilityExceptions
        SET
            ExceptionDate = @ExceptionDate,
            StartTime = @StartTime,
            EndTime = @EndTime,
            IsAvailable = @IsAvailable,
            Reason = @Reason,
            UpdatedAt = GETDATE()
        WHERE ExceptionID = @ExceptionID;
        
        SELECT @ExceptionID AS ExceptionID;
    END
END;
GO

-- Delete a vendor availability exception
CREATE OR ALTER PROCEDURE sp_DeleteVendorAvailabilityException
    @ExceptionID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM VendorAvailabilityExceptions
    WHERE ExceptionID = @ExceptionID AND VendorProfileID = @VendorProfileID;

    SELECT CAST(@@ROWCOUNT AS BIT) AS Success;
END;
GO
