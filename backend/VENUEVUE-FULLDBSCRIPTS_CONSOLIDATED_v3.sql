-- ==============================================
-- COMPLETE VENDOR SETUP ENHANCEMENT SQL SCRIPT
-- VenueVue Enhanced Vendor Setup System
-- ==============================================

-- This script includes all the original database schema plus
-- enhanced vendor setup functionality with:
-- 1. Gallery management (upload + URL support)
-- 2. Packages and services creation
-- 3. Social media integration
-- 4. Availability scheduling
-- 5. Progress tracking

-- ======================
-- TABLES (Original + Enhancements)
-- ======================

-- Users table with enhanced fields
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

-- Enhanced Vendor Profiles with setup tracking
CREATE TABLE VendorProfiles (
    VendorProfileID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID) UNIQUE,
    BusinessName NVARCHAR(100),
    DisplayName NVARCHAR(100),
    BusinessDescription NVARCHAR(MAX),
    Tagline NVARCHAR(255),
    BusinessPhone NVARCHAR(20),
    BusinessEmail NVARCHAR(100),
    Website NVARCHAR(255),
    YearsInBusiness INT,
    LicenseNumber NVARCHAR(50),
    InsuranceVerified BIT DEFAULT 0,
    IsVerified BIT DEFAULT 0,
    IsCompleted BIT DEFAULT 0,
    -- Enhanced Setup Tracking Fields
    SetupStep INT DEFAULT 1,
    SetupCompleted BIT DEFAULT 0,
    GalleryCompleted BIT DEFAULT 0,
    PackagesCompleted BIT DEFAULT 0,
    ServicesCompleted BIT DEFAULT 0,
    SocialMediaCompleted BIT DEFAULT 0,
    AvailabilityCompleted BIT DEFAULT 0,
    -- End Setup Tracking
    StripeAccountID NVARCHAR(100),
    AverageResponseTime INT,
    ResponseRate DECIMAL(5,2),
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
    FeaturedImageURL NVARCHAR(255),
    BookingLink NVARCHAR(255),
    AcceptingBookings BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Enhanced Vendor Images with support for both uploads and URLs
CREATE TABLE VendorImages (
    ImageID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    ImageURL NVARCHAR(500) NOT NULL, -- Increased size for URLs
    ImageType NVARCHAR(10) DEFAULT 'upload', -- 'upload' or 'url'
    IsPrimary BIT DEFAULT 0,
    DisplayOrder INT DEFAULT 0,
    Caption NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Enhanced Vendor Social Media
CREATE TABLE VendorSocialMedia (
    SocialID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    Platform NVARCHAR(50) NOT NULL,
    URL NVARCHAR(500) NOT NULL, -- Increased size for full URLs
    DisplayOrder INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT UC_VendorSocialPlatform UNIQUE (VendorProfileID, Platform)
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

-- Enhanced Vendor Business Hours with better availability tracking
CREATE TABLE VendorBusinessHours (
    HoursID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    DayOfWeek TINYINT NOT NULL CHECK (DayOfWeek BETWEEN 0 AND 6), -- 0=Sunday
    OpenTime TIME,
    CloseTime TIME,
    IsAvailable BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
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

-- Enhanced Service Categories for better package/service organization
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

-- Enhanced Services with package support
CREATE TABLE Services (
    ServiceID INT PRIMARY KEY IDENTITY(1,1),
    CategoryID INT FOREIGN KEY REFERENCES ServiceCategories(CategoryID),
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(10, 2) NOT NULL,
    DurationMinutes INT,
    MinDuration INT,
    MaxAttendees INT,
    ServiceType NVARCHAR(20) DEFAULT 'Service', -- 'Service' or 'Package'
    IsActive BIT DEFAULT 1,
    RequiresDeposit BIT DEFAULT 1,
    DepositPercentage DECIMAL(5,2) DEFAULT 20.00,
    CancellationPolicy NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Continue with other essential tables...
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
    IsApproved BIT DEFAULT 1, -- Auto-approve for demo
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE Favorites (
    FavoriteID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT UC_Favorite UNIQUE (UserID, VendorProfileID)
);
GO

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

CREATE TABLE Notifications (
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Type NVARCHAR(50) NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    IsRead BIT DEFAULT 0,
    ReadAt DATETIME,
    RelatedID INT,
    RelatedType NVARCHAR(50),
    ActionURL NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- ======================
-- ENHANCED VENDOR SETUP STORED PROCEDURES
-- ======================

-- Complete vendor setup with all data in one transaction
CREATE OR ALTER PROCEDURE sp_CompleteVendorSetup
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
            INSERT INTO Services (CategoryID, Name, Description, Price, DurationMinutes, ServiceType)
            SELECT 
                @ServicesCategoryID,
                JSON_VALUE(value, '$.name'),
                JSON_VALUE(value, '$.description'),
                CAST(JSON_VALUE(value, '$.price') AS DECIMAL(10,2)),
                CASE 
                    WHEN JSON_VALUE(value, '$.duration') LIKE '%hour%' 
                    THEN CAST(SUBSTRING(JSON_VALUE(value, '$.duration'), 1, CHARINDEX(' ', JSON_VALUE(value, '$.duration')) - 1) AS INT) * 60
                    ELSE 60
                END,
                'Service'
            FROM OPENJSON(@ServicesData);
            
            -- Mark services as completed
            UPDATE VendorProfiles SET ServicesCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        END
        
        -- Save social media using VendorSocialMedia table
        IF @SocialMediaData IS NOT NULL
        BEGIN
            -- Clear existing social media
            DELETE FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID;
            
            -- Insert new social media links
            INSERT INTO VendorSocialMedia (VendorProfileID, Platform, URL, DisplayOrder)
            SELECT 
                @VendorProfileID,
                [key],
                [value],
                ROW_NUMBER() OVER (ORDER BY [key])
            FROM OPENJSON(@SocialMediaData)
            WHERE [value] IS NOT NULL AND [value] != '';
            
            -- Mark social media as completed
            UPDATE VendorProfiles SET SocialMediaCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        END
        
        -- Save availability using VendorBusinessHours table
        IF @AvailabilityData IS NOT NULL
        BEGIN
            -- Clear existing availability
            DELETE FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID;
            
            -- Insert new availability
            INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable)
            SELECT 
                @VendorProfileID,
                CAST(JSON_VALUE(value, '$.day') AS TINYINT),
                CAST(JSON_VALUE(value, '$.start') AS TIME),
                CAST(JSON_VALUE(value, '$.end') AS TIME),
                1
            FROM OPENJSON(@AvailabilityData);
            
            -- Mark availability as completed
            UPDATE VendorProfiles SET AvailabilityCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        END
        
        -- Update vendor setup completion status
        UPDATE VendorProfiles 
        SET 
            SetupCompleted = CASE 
                WHEN GalleryCompleted = 1 AND PackagesCompleted = 1 AND ServicesCompleted = 1 
                     AND SocialMediaCompleted = 1 AND AvailabilityCompleted = 1 
                THEN 1 ELSE 0 
            END,
            SetupStep = 4,
            IsVerified = 1, -- Mark as verified when setup is complete
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID;
        
        COMMIT TRANSACTION;
        
        SELECT 1 AS Success, 'Vendor setup completed successfully' AS Message;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
    END CATCH
END;
GO

-- Add gallery image using existing VendorImages table
CREATE OR ALTER PROCEDURE sp_AddVendorGalleryImage
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

-- Add vendor package using existing Services table
CREATE OR ALTER PROCEDURE sp_AddVendorPackage
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

-- Add vendor service
CREATE OR ALTER PROCEDURE sp_AddVendorService
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

-- Add social media link using existing VendorSocialMedia table
CREATE OR ALTER PROCEDURE sp_AddVendorSocialMedia
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

-- Add availability slot using existing VendorBusinessHours table
CREATE OR ALTER PROCEDURE sp_AddVendorAvailability
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

-- Get vendor setup progress
CREATE OR ALTER PROCEDURE sp_GetVendorSetupProgress
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

-- Update vendor setup step
CREATE OR ALTER PROCEDURE sp_UpdateVendorSetupStep
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

-- ======================
-- ESSENTIAL EXISTING PROCEDURES (Updated for compatibility)
-- ======================

-- Enhanced vendor registration
CREATE OR ALTER PROCEDURE sp_RegisterVendor
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
            -- Create new vendor profile with setup tracking
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
                IsCompleted,
                SetupStep,
                SetupCompleted
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
                0, -- Not completed yet (multi-step process)
                1, -- Start at step 1
                0  -- Setup not completed
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

-- Enhanced vendor search procedure
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
    @SortBy NVARCHAR(50) = 'recommended'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate pagination parameters
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 10;
    IF @PageSize > 100 SET @PageSize = 100;
    
    SELECT 
        v.VendorProfileID AS id,
        v.BusinessName AS name,
        v.DisplayName,
        CONCAT(v.City, ', ', v.State) AS location,
        (SELECT TOP 1 vc.Category FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS type,
        v.BusinessDescription AS description,
        v.PriceLevel,
        (SELECT MIN(s.Price) FROM Services s 
         JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID 
         WHERE sc.VendorProfileID = v.VendorProfileID) AS price,
        CAST(ISNULL((SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) AS rating,
        ISNULL((SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS ReviewCount,
        (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) AS FavoriteCount,
        (SELECT COUNT(*) FROM Bookings b WHERE b.VendorProfileID = v.VendorProfileID) AS BookingCount,
        ISNULL((SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1), '') AS image,
        v.Capacity,
        v.Rooms,
        v.IsPremium,
        v.IsEcoFriendly,
        v.IsAwardWinning,
        (SELECT STRING_AGG(vc.Category, ', ') FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories,
        (SELECT COUNT(*) FROM (
            SELECT v2.VendorProfileID
            FROM VendorProfiles v2
            JOIN Users u2 ON v2.UserID = u2.UserID
            WHERE u2.IsActive = 1 AND v2.IsVerified = 1
            AND (@SearchTerm IS NULL OR v2.BusinessName LIKE '%' + @SearchTerm + '%' OR v2.BusinessDescription LIKE '%' + @SearchTerm + '%')
            AND (@Category IS NULL OR EXISTS (SELECT 1 FROM VendorCategories vc WHERE vc.VendorProfileID = v2.VendorProfileID AND vc.Category = @Category))
            AND (@IsPremium IS NULL OR v2.IsPremium = @IsPremium)
            AND (@IsEcoFriendly IS NULL OR v2.IsEcoFriendly = @IsEcoFriendly)
            AND (@IsAwardWinning IS NULL OR v2.IsAwardWinning = @IsAwardWinning)
        ) AS FilteredResults) AS TotalCount
    FROM VendorProfiles v
    JOIN Users u ON v.UserID = u.UserID
    WHERE u.IsActive = 1 AND v.IsVerified = 1
    AND (@SearchTerm IS NULL OR v.BusinessName LIKE '%' + @SearchTerm + '%' OR v.BusinessDescription LIKE '%' + @SearchTerm + '%')
    AND (@Category IS NULL OR EXISTS (SELECT 1 FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID AND vc.Category = @Category))
    AND (@IsPremium IS NULL OR v.IsPremium = @IsPremium)
    AND (@IsEcoFriendly IS NULL OR v.IsEcoFriendly = @IsEcoFriendly)
    AND (@IsAwardWinning IS NULL OR v.IsAwardWinning = @IsAwardWinning)
    ORDER BY 
        CASE @SortBy
            WHEN 'price-low' THEN (SELECT MIN(s.Price) FROM Services s JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID WHERE sc.VendorProfileID = v.VendorProfileID)
            ELSE NULL
        END ASC,
        CASE @SortBy
            WHEN 'price-high' THEN (SELECT MIN(s.Price) FROM Services s JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID WHERE sc.VendorProfileID = v.VendorProfileID)
            WHEN 'rating' THEN (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1)
            WHEN 'popular' THEN (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID)
            ELSE NULL
        END DESC,
        v.BusinessName
    OFFSET ((@PageNumber - 1) * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- Get vendor details with enhanced setup data
CREATE OR ALTER PROCEDURE sp_GetVendorDetails
    @VendorProfileID INT,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Vendor profile with setup progress
    SELECT 
        v.*,
        ISNULL(v.SetupStep, 1) AS SetupStep,
        ISNULL(v.SetupCompleted, 0) AS SetupCompleted,
        (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
        (SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
        (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) AS FavoriteCount,
        (SELECT COUNT(*) FROM Bookings b WHERE b.VendorProfileID = v.VendorProfileID) AS BookingCount
    FROM VendorProfiles v 
    WHERE v.VendorProfileID = @VendorProfileID;
    
    -- Vendor categories
    SELECT Category FROM VendorCategories WHERE VendorProfileID = @VendorProfileID ORDER BY Category;
    
    -- Enhanced services with categories (including packages)
    SELECT 
        sc.CategoryID,
        sc.Name AS CategoryName,
        sc.Description AS CategoryDescription,
        s.ServiceID,
        s.Name AS ServiceName,
        s.Description AS ServiceDescription,
        s.Price,
        s.DurationMinutes,
        s.MaxAttendees,
        s.ServiceType,
        s.RequiresDeposit,
        s.DepositPercentage,
        s.IsActive
    FROM ServiceCategories sc
    LEFT JOIN Services s ON sc.CategoryID = s.CategoryID AND s.IsActive = 1
    WHERE sc.VendorProfileID = @VendorProfileID
    ORDER BY sc.DisplayOrder, sc.Name, s.ServiceType DESC, s.Name;
    
    -- Service add-ons (placeholder for future enhancement)
    SELECT NULL AS AddOnID, NULL AS ServiceID, NULL AS Name, NULL AS Description, NULL AS Price WHERE 1=0;
    
    -- Portfolio (placeholder - using gallery images)
    SELECT 
        ImageID AS PortfolioID,
        'Portfolio Item' AS Title,
        Caption AS Description,
        ImageURL,
        CreatedAt AS ProjectDate,
        DisplayOrder
    FROM VendorImages 
    WHERE VendorProfileID = @VendorProfileID AND IsPrimary = 0
    ORDER BY DisplayOrder;
    
    -- Reviews
    SELECT 
        r.ReviewID,
        r.UserID,
        u.Name AS ReviewerName,
        u.Avatar AS ReviewerAvatar,
        r.Rating,
        r.Title,
        r.Comment,
        r.Response,
        r.ResponseDate,
        r.IsAnonymous,
        r.IsFeatured,
        r.CreatedAt
    FROM Reviews r
    JOIN Users u ON r.UserID = u.UserID
    WHERE r.VendorProfileID = @VendorProfileID AND r.IsApproved = 1
    ORDER BY r.IsFeatured DESC, r.CreatedAt DESC;
    
    -- FAQs (placeholder for future enhancement)
    SELECT NULL AS FAQID, NULL AS Question, NULL AS Answer, NULL AS DisplayOrder WHERE 1=0;
    
    -- Team (placeholder for future enhancement)
    SELECT NULL AS TeamMemberID, NULL AS Name, NULL AS Role, NULL AS Bio, NULL AS ImageURL, NULL AS DisplayOrder WHERE 1=0;
    
    -- Social media
    SELECT * FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder, Platform;
    
    -- Business hours
    SELECT * FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID ORDER BY DayOfWeek;
    
    -- Images (gallery)
    SELECT * FROM VendorImages WHERE VendorProfileID = @VendorProfileID ORDER BY IsPrimary DESC, DisplayOrder;
    
    -- Is favorite for current user
    IF @UserID IS NOT NULL
    BEGIN
        SELECT CAST(CASE WHEN EXISTS (
            SELECT 1 FROM Favorites 
            WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
        ) THEN 1 ELSE 0 END AS BIT) AS IsFavorite;
    END
    ELSE
    BEGIN
        SELECT CAST(0 AS BIT) AS IsFavorite;
    END
    
    -- Available slots (simplified)
    SELECT NULL AS SlotID, NULL AS ServiceID, NULL AS DayOfWeek, NULL AS Date, NULL AS StartTime, NULL AS EndTime WHERE 1=0;
END;
GO

-- Toggle favorite
CREATE OR ALTER PROCEDURE sp_ToggleFavorite
    @UserID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @IsFavorite BIT = 0;
    
    -- Check if already favorited
    IF EXISTS (SELECT 1 FROM Favorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID)
    BEGIN
        -- Remove from favorites
        DELETE FROM Favorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID;
        SET @IsFavorite = 0;
    END
    ELSE
    BEGIN
        -- Add to favorites
        INSERT INTO Favorites (UserID, VendorProfileID) VALUES (@UserID, @VendorProfileID);
        SET @IsFavorite = 1;
    END
    
    SELECT @IsFavorite AS IsFavorite;
END;
GO

-- User registration
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
        
        -- If vendor, create basic vendor profile
        IF @IsVendor = 1
        BEGIN
            INSERT INTO VendorProfiles (UserID, BusinessName, SetupStep, SetupCompleted)
            VALUES (@UserID, @Name, 1, 0);
        END
        
        COMMIT TRANSACTION;
        
        SELECT @UserID AS UserID, @IsVendor AS IsVendor;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Social user registration
CREATE OR ALTER PROCEDURE sp_RegisterSocialUser
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
        VALUES (@Name, @Email, @AuthProvider, @Avatar, 0);
        SET @UserID = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        -- User exists, update details if needed
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

-- ======================
-- ESSENTIAL VIEWS FOR VENDOR SETUP
-- ======================

-- Enhanced vendor details view
CREATE OR ALTER VIEW vw_VendorDetails AS
SELECT 
    v.VendorProfileID,
    v.UserID,
    u.Name AS OwnerName,
    u.Email AS OwnerEmail,
    v.BusinessName,
    v.DisplayName,
    v.Tagline,
    v.BusinessDescription,
    v.BusinessPhone,
    v.BusinessEmail,
    v.Website,
    v.YearsInBusiness,
    v.IsVerified,
    v.IsCompleted,
    v.SetupStep,
    v.SetupCompleted,
    v.GalleryCompleted,
    v.PackagesCompleted,
    v.ServicesCompleted,
    v.SocialMediaCompleted,
    v.AvailabilityCompleted,
    v.Address,
    v.City,
    v.State,
    v.Country,
    v.PostalCode,
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

-- ======================
-- SAMPLE DATA INSERTION (Optional)
-- ======================

-- Insert sample categories for testing
-- INSERT INTO VendorCategories (VendorProfileID, Category) VALUES 
-- (1, 'Photography'), (1, 'Videography'),
-- (2, 'Catering'), (2, 'Event Planning');

-- ======================
-- INDEXES FOR PERFORMANCE
-- ======================

-- Create indexes for better performance
CREATE NONCLUSTERED INDEX IX_VendorProfiles_SetupStep ON VendorProfiles(SetupStep);
CREATE NONCLUSTERED INDEX IX_VendorProfiles_SetupCompleted ON VendorProfiles(SetupCompleted);
CREATE NONCLUSTERED INDEX IX_VendorImages_VendorProfileID ON VendorImages(VendorProfileID);
CREATE NONCLUSTERED INDEX IX_VendorSocialMedia_VendorProfileID ON VendorSocialMedia(VendorProfileID);
CREATE NONCLUSTERED INDEX IX_VendorBusinessHours_VendorProfileID ON VendorBusinessHours(VendorProfileID);
CREATE NONCLUSTERED INDEX IX_Services_CategoryID ON Services(CategoryID);
CREATE NONCLUSTERED INDEX IX_ServiceCategories_VendorProfileID ON ServiceCategories(VendorProfileID);

-- ======================
-- COMPLETION MESSAGE
-- ======================

PRINT 'Enhanced Vendor Setup Database Schema and Stored Procedures Created Successfully!';
PRINT '';
PRINT 'Features Implemented:';
PRINT '✓ Gallery Management (Upload + URL Support)';
PRINT '✓ Packages and Services Creation';
PRINT '✓ Social Media Integration';
PRINT '✓ Availability Scheduling';
PRINT '✓ Progress Tracking (Step 1, 2, 3, 4)';
PRINT '✓ Enhanced Stored Procedures';
PRINT '✓ Performance Indexes';
PRINT '';
PRINT 'Ready for Frontend Integration!';
