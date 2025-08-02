

/*
============================================================
01_ User Management Tables.sql
============================================================
*/

-- Section 1: User Management Tables

-- UserRoles table
CREATE TABLE UserRoles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL,
    Description NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_UserRoles_RoleName UNIQUE (RoleName)
);
GO
-- Users table
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) NOT NULL,
    EmailConfirmed BIT NOT NULL DEFAULT 0,
    PasswordHash NVARCHAR(255) NULL,
    PasswordSalt NVARCHAR(255) NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    PhoneNumber NVARCHAR(20) NULL,
    PhoneNumberConfirmed BIT NOT NULL DEFAULT 0,
    AvatarURL NVARCHAR(255) NULL,
    DateOfBirth DATE NULL,
    LastLoginDate DATETIME NULL,
    FailedLoginAttempts INT NOT NULL DEFAULT 0,
    IsLockedOut BIT NOT NULL DEFAULT 0,
    LockoutEndDate DATETIME NULL,
    TwoFactorEnabled BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_Users_Email UNIQUE (Email)
);
GO
-- UserRoles mapping table
CREATE TABLE UserRoleMappings (
    MappingID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    RoleID INT NOT NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_UserRoleMappings_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_UserRoleMappings_RoleID FOREIGN KEY (RoleID) REFERENCES UserRoles(RoleID),
    CONSTRAINT UQ_UserRoleMappings_UserRole UNIQUE (UserID, RoleID)
);
GO
-- UserSessions table
CREATE TABLE UserSessions (
    SessionID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserID INT NOT NULL,
    SessionToken NVARCHAR(255) NOT NULL,
    IPAddress NVARCHAR(45) NULL,
    UserAgent NVARCHAR(255) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ExpiryDate DATETIME NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    LastActivityDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_UserSessions_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO
-- SocialLoginProviders table
CREATE TABLE SocialLoginProviders (
    ProviderID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderName NVARCHAR(50) NOT NULL,
    ClientID NVARCHAR(255) NOT NULL,
    ClientSecret NVARCHAR(255) NOT NULL,
    AuthorizationEndpoint NVARCHAR(255) NOT NULL,
    TokenEndpoint NVARCHAR(255) NOT NULL,
    UserInfoEndpoint NVARCHAR(255) NOT NULL,
    Scope NVARCHAR(255) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_SocialLoginProviders_ProviderName UNIQUE (ProviderName)
);
GO
-- UserSocialLogins table
CREATE TABLE UserSocialLogins (
    UserSocialLoginID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ProviderID INT NOT NULL,
    ProviderKey NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NULL,
    FirstName NVARCHAR(100) NULL,
    LastName NVARCHAR(100) NULL,
    ProfilePictureURL NVARCHAR(255) NULL,
    AccessToken NVARCHAR(MAX) NULL,
    RefreshToken NVARCHAR(MAX) NULL,
    TokenExpiration DATETIME NULL,
    DateLinked DATETIME NOT NULL DEFAULT GETDATE(),
    LastLoginDate DATETIME NULL,
    CONSTRAINT FK_UserSocialLogins_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_UserSocialLogins_ProviderID FOREIGN KEY (ProviderID) REFERENCES SocialLoginProviders(ProviderID),
    CONSTRAINT UQ_UserSocialLogins_ProviderKey UNIQUE (ProviderID, ProviderKey)
);
GO
-- UserPreferences table
CREATE TABLE UserPreferences (
    PreferenceID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    NotificationPrefs NVARCHAR(MAX) NULL,
    CommunicationPrefs NVARCHAR(MAX) NULL,
    ThemePrefs NVARCHAR(50) NULL DEFAULT 'light',
    LanguagePref NVARCHAR(10) NULL DEFAULT 'en-US',
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_UserPreferences_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT UQ_UserPreferences_UserID UNIQUE (UserID)
);
GO



/*
============================================================
02_ Service Provider Tables.sql
============================================================
*/

-- Section 2: Service Provider Tables

-- ProviderTypes table
CREATE TABLE ProviderTypes (
    TypeID INT IDENTITY(1,1) PRIMARY KEY,
    TypeName NVARCHAR(100) NOT NULL,
    Category NVARCHAR(50) NOT NULL,
    IconClass NVARCHAR(50) NULL,
    Description NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    DisplayOrder INT NOT NULL DEFAULT 0,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_ProviderTypes_TypeName UNIQUE (TypeName)
);
GO
-- ServiceProviders table
CREATE TABLE ServiceProviders (
    ProviderID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    BusinessName NVARCHAR(255) NOT NULL,
    BusinessDescription NVARCHAR(MAX) NULL,
    TypeID INT NOT NULL,
    YearsExperience INT NULL,
    IsMobile BIT NOT NULL DEFAULT 0,
    TravelRadius INT NULL, -- in miles/kilometers
    BasePrice DECIMAL(18, 2) NULL,
    MinEventSize INT NULL,
    MaxEventSize INT NULL,
    IsInsured BIT NOT NULL DEFAULT 0,
    InsuranceDetails NVARCHAR(255) NULL,
    IsFeatured BIT NOT NULL DEFAULT 0,
    IsVerified BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    LastUpdated DATETIME NULL,
    CONSTRAINT FK_ServiceProviders_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_ServiceProviders_TypeID FOREIGN KEY (TypeID) REFERENCES ProviderTypes(TypeID)
);
GO
-- ProviderServices table
CREATE TABLE ProviderServices (
    ProviderServiceID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderID INT NOT NULL,
    ServiceName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    BasePrice DECIMAL(18, 2) NOT NULL,
    PriceType NVARCHAR(20) NOT NULL, -- hourly, per event, per person
    MinDuration INT NULL, -- in minutes
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_ProviderServices_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID)
);
GO
-- ProviderServicePackages table
CREATE TABLE ProviderServicePackages (
    PackageID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderID INT NOT NULL,
    PackageName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Price DECIMAL(18, 2) NOT NULL,
    IncludedServices NVARCHAR(MAX) NULL, -- JSON array of service IDs
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_ProviderServicePackages_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID)
);
GO
-- ProviderAvailability table
CREATE TABLE ProviderAvailability (
    AvailabilityID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderID INT NOT NULL,
    DayOfWeek TINYINT NOT NULL, -- 1-7 (Sunday=1)
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    IsAvailable BIT NOT NULL DEFAULT 1,
    Notes NVARCHAR(255) NULL,
    CONSTRAINT FK_ProviderAvailability_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID),
    CONSTRAINT CK_ProviderAvailability_DayOfWeek CHECK (DayOfWeek BETWEEN 1 AND 7)
);
GO
-- ProviderBlackoutDates table
CREATE TABLE ProviderBlackoutDates (
    BlackoutID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Reason NVARCHAR(255) NULL,
    IsRecurring BIT NOT NULL DEFAULT 0,
    RecurrencePattern NVARCHAR(50) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_ProviderBlackoutDates_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID),
    CONSTRAINT CK_ProviderBlackoutDates_DateRange CHECK (EndDate >= StartDate)
);
GO
-- ProviderEquipment table
CREATE TABLE ProviderEquipment (
    EquipmentID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderID INT NOT NULL,
    EquipmentName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Quantity INT NOT NULL DEFAULT 1,
    IncludedInBasePrice BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_ProviderEquipment_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID)
);
GO
-- ProviderPortfolio table
CREATE TABLE ProviderPortfolio (
    PortfolioID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderID INT NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    ImageURL NVARCHAR(255) NOT NULL,
    VideoURL NVARCHAR(255) NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsFeatured BIT NOT NULL DEFAULT 0,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_ProviderPortfolio_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID)
);
GO
-- ProviderLocations table (for mobile providers or providers with multiple locations)
CREATE TABLE ProviderLocations (
    LocationID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderID INT NOT NULL,
    AddressLine1 NVARCHAR(255) NOT NULL,
    AddressLine2 NVARCHAR(255) NULL,
    City NVARCHAR(100) NOT NULL,
    StateProvince NVARCHAR(100) NOT NULL,
    PostalCode NVARCHAR(20) NOT NULL,
    Country NVARCHAR(100) NOT NULL,
    Latitude DECIMAL(10, 8) NULL,
    Longitude DECIMAL(11, 8) NULL,
    IsPrimary BIT NOT NULL DEFAULT 0,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_ProviderLocations_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID)
);
GO



/*
============================================================
03_ Event and Booking Tables.sql
============================================================
*/

-- Section 3: Event and Booking Tables

-- EventTypes table
CREATE TABLE EventTypes (
    EventTypeID INT IDENTITY(1,1) PRIMARY KEY,
    TypeName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255) NULL,
    IconClass NVARCHAR(50) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_EventTypes_TypeName UNIQUE (TypeName)
);
GO
-- BookingStatuses table
CREATE TABLE BookingStatuses (
    StatusID INT IDENTITY(1,1) PRIMARY KEY,
    StatusName NVARCHAR(50) NOT NULL,
    Description NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_BookingStatuses_StatusName UNIQUE (StatusName)
);
GO
-- Bookings table
CREATE TABLE Bookings (
    BookingID INT IDENTITY(1,1) PRIMARY KEY,
    EventTypeID INT NOT NULL,
    UserID INT NOT NULL,
    EventName NVARCHAR(255) NOT NULL,
    EventDescription NVARCHAR(MAX) NULL,
    EventDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    GuestCount INT NOT NULL,
    StatusID INT NOT NULL,
    TotalPrice DECIMAL(18, 2) NOT NULL,
    DepositAmount DECIMAL(18, 2) NOT NULL,
    DepositPaid BIT NOT NULL DEFAULT 0,
    BalanceDueDate DATE NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    LastUpdated DATETIME NULL,
    CONSTRAINT FK_Bookings_EventTypeID FOREIGN KEY (EventTypeID) REFERENCES EventTypes(EventTypeID),
    CONSTRAINT FK_Bookings_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_Bookings_StatusID FOREIGN KEY (StatusID) REFERENCES BookingStatuses(StatusID),
    CONSTRAINT CK_Bookings_Time CHECK (EndTime > StartTime)
);
GO
-- BookingProviders table
CREATE TABLE BookingProviders (
    BookingProviderID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL,
    ProviderID INT NOT NULL,
    ProviderTypeID INT NOT NULL,
    ServiceDetails NVARCHAR(MAX) NULL, -- JSON with selected services/packages
    SpecialRequests NVARCHAR(MAX) NULL,
    StatusID INT NOT NULL,
    Price DECIMAL(18, 2) NOT NULL,
    DepositAmount DECIMAL(18, 2) NOT NULL,
    DepositPaid BIT NOT NULL DEFAULT 0,
    BalanceDueDate DATE NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_BookingProviders_BookingID FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    CONSTRAINT FK_BookingProviders_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID),
    CONSTRAINT FK_BookingProviders_ProviderTypeID FOREIGN KEY (ProviderTypeID) REFERENCES ProviderTypes(TypeID),
    CONSTRAINT FK_BookingProviders_StatusID FOREIGN KEY (StatusID) REFERENCES BookingStatuses(StatusID)
);
GO
-- BookingTimeline table
CREATE TABLE BookingTimeline (
    TimelineID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL,
    EventDate DATETIME NOT NULL,
    EventType NVARCHAR(50) NOT NULL, -- Meeting, Payment, Reminder, etc.
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Completed BIT NOT NULL DEFAULT 0,
    CompletedDate DATETIME NULL,
    NotificationSent BIT NOT NULL DEFAULT 0,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_BookingTimeline_BookingID FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID)
);
GO
-- BookingMessages table (communication between users and providers)
CREATE TABLE BookingMessages (
    MessageID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL,
    SenderID INT NOT NULL,
    MessageText NVARCHAR(MAX) NOT NULL,
    IsRead BIT NOT NULL DEFAULT 0,
    ReadDate DATETIME NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_BookingMessages_BookingID FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    CONSTRAINT FK_BookingMessages_SenderID FOREIGN KEY (SenderID) REFERENCES Users(UserID)
);
GO



/*
============================================================
04_ Financial Tables.sql
============================================================
*/

-- Section 4: Financial Tables

-- PaymentMethods table
CREATE TABLE PaymentMethods (
    MethodID INT IDENTITY(1,1) PRIMARY KEY,
    MethodName NVARCHAR(50) NOT NULL,
    IsOnline BIT NOT NULL DEFAULT 1,
    ProcessingFeePercent DECIMAL(5, 2) NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_PaymentMethods_MethodName UNIQUE (MethodName)
);
GO
-- Payments table
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NULL,
    UserID INT NOT NULL,
    ProviderID INT NULL,
    Amount DECIMAL(18, 2) NOT NULL,
    PaymentDate DATETIME NOT NULL DEFAULT GETDATE(),
    MethodID INT NOT NULL,
    TransactionID NVARCHAR(255) NULL,
    Status NVARCHAR(20) NOT NULL, -- Pending, Completed, Failed, Refunded
    FeeAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    NetAmount DECIMAL(18, 2) NOT NULL,
    Notes NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Payments_BookingID FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    CONSTRAINT FK_Payments_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_Payments_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID),
    CONSTRAINT FK_Payments_MethodID FOREIGN KEY (MethodID) REFERENCES PaymentMethods(MethodID)
);
GO
-- Payouts table
CREATE TABLE Payouts (
    PayoutID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderID INT NOT NULL,
    Amount DECIMAL(18, 2) NOT NULL,
    PayoutDate DATETIME NOT NULL DEFAULT GETDATE(),
    MethodID INT NOT NULL,
    Status NVARCHAR(20) NOT NULL, -- Pending, Completed, Failed
    TransactionID NVARCHAR(255) NULL,
    FeeAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    NetAmount DECIMAL(18, 2) NOT NULL,
    Notes NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Payouts_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID),
    CONSTRAINT FK_Payouts_MethodID FOREIGN KEY (MethodID) REFERENCES PaymentMethods(MethodID)
);
GO
-- Invoices table
CREATE TABLE Invoices (
    InvoiceID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL,
    InvoiceNumber NVARCHAR(50) NOT NULL,
    IssueDate DATE NOT NULL DEFAULT GETDATE(),
    DueDate DATE NOT NULL,
    Status NVARCHAR(20) NOT NULL, -- Draft, Sent, Paid, Overdue, Cancelled
    Subtotal DECIMAL(18, 2) NOT NULL,
    TaxAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    TotalAmount DECIMAL(18, 2) NOT NULL,
    AmountPaid DECIMAL(18, 2) NOT NULL DEFAULT 0,
    BalanceDue DECIMAL(18, 2) NOT NULL,
    PDFPath NVARCHAR(255) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_Invoices_BookingID FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    CONSTRAINT UQ_Invoices_InvoiceNumber UNIQUE (InvoiceNumber)
);
GO
-- TaxRates table
CREATE TABLE TaxRates (
    TaxRateID INT IDENTITY(1,1) PRIMARY KEY,
    Country NVARCHAR(100) NOT NULL,
    StateProvince NVARCHAR(100) NULL,
    City NVARCHAR(100) NULL,
    TaxName NVARCHAR(100) NOT NULL,
    Rate DECIMAL(5, 4) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    EffectiveFrom DATE NOT NULL DEFAULT GETDATE(),
    EffectiveTo DATE NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL
);
GO
-- PricingTiers table
CREATE TABLE PricingTiers (
    TierID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderID INT NULL,
    ProviderTypeID INT NULL,
    TierName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255) NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    PriceMultiplier DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_PricingTiers_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID),
    CONSTRAINT FK_PricingTiers_ProviderTypeID FOREIGN KEY (ProviderTypeID) REFERENCES ProviderTypes(TypeID),
    CONSTRAINT CK_PricingTiers_DateRange CHECK (EndDate >= StartDate)
);
GO



/*
============================================================
05_ Reviews and Ratings.sql
============================================================
*/

-- Section 5: Reviews and Ratings

-- ProviderReviews table
CREATE TABLE ProviderReviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderID INT NOT NULL,
    UserID INT NOT NULL,
    BookingID INT NULL,
    Rating TINYINT NOT NULL, -- 1-5
    ReviewText NVARCHAR(MAX) NULL,
    ReviewDate DATETIME NOT NULL DEFAULT GETDATE(),
    IsApproved BIT NOT NULL DEFAULT 0,
    ResponseText NVARCHAR(MAX) NULL,
    ResponseDate DATETIME NULL,
    CONSTRAINT FK_ProviderReviews_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID),
    CONSTRAINT FK_ProviderReviews_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_ProviderReviews_BookingID FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    CONSTRAINT CK_ProviderReviews_Rating CHECK (Rating BETWEEN 1 AND 5)
);
GO
-- ReviewCategories table (for detailed ratings)
CREATE TABLE ReviewCategories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderTypeID INT NOT NULL,
    CategoryName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_ReviewCategories_ProviderTypeID FOREIGN KEY (ProviderTypeID) REFERENCES ProviderTypes(TypeID)
);
GO
-- ReviewCategoryRatings table
CREATE TABLE ReviewCategoryRatings (
    RatingID INT IDENTITY(1,1) PRIMARY KEY,
    ReviewID INT NOT NULL,
    CategoryID INT NOT NULL,
    Rating TINYINT NOT NULL, -- 1-5
    CONSTRAINT FK_ReviewCategoryRatings_ReviewID FOREIGN KEY (ReviewID) REFERENCES ProviderReviews(ReviewID),
    CONSTRAINT FK_ReviewCategoryRatings_CategoryID FOREIGN KEY (CategoryID) REFERENCES ReviewCategories(CategoryID),
    CONSTRAINT CK_ReviewCategoryRatings_Rating CHECK (Rating BETWEEN 1 AND 5)
);
GO



/*
============================================================
06_ Marketing and Analytics.sql
============================================================
*/

-- Section 6: Marketing and Analytics

-- Promotions table
CREATE TABLE Promotions (
    PromotionID INT IDENTITY(1,1) PRIMARY KEY,
    PromotionCode NVARCHAR(50) NOT NULL,
    Description NVARCHAR(255) NULL,
    DiscountType NVARCHAR(20) NOT NULL, -- Percentage, FixedAmount
    DiscountValue DECIMAL(18, 2) NOT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    MaxUses INT NULL,
    CurrentUses INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_Promotions_PromotionCode UNIQUE (PromotionCode),
    CONSTRAINT CK_Promotions_DateRange CHECK (EndDate >= StartDate)
);
GO
-- PromotionRedemptions table
CREATE TABLE PromotionRedemptions (
    RedemptionID INT IDENTITY(1,1) PRIMARY KEY,
    PromotionID INT NOT NULL,
    BookingID INT NULL,
    UserID INT NOT NULL,
    RedemptionDate DATETIME NOT NULL DEFAULT GETDATE(),
    DiscountAmount DECIMAL(18, 2) NOT NULL,
    CONSTRAINT FK_PromotionRedemptions_PromotionID FOREIGN KEY (PromotionID) REFERENCES Promotions(PromotionID),
    CONSTRAINT FK_PromotionRedemptions_BookingID FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    CONSTRAINT FK_PromotionRedemptions_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO
-- Wishlists table
CREATE TABLE Wishlists (
    WishlistID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ProviderID INT NOT NULL,
    Notes NVARCHAR(255) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Wishlists_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_Wishlists_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID),
    CONSTRAINT UQ_Wishlists_UserProvider UNIQUE (UserID, ProviderID)
);
GO
-- SearchHistory table
CREATE TABLE SearchHistory (
    SearchID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL,
    SearchQuery NVARCHAR(255) NOT NULL,
    SearchFilters NVARCHAR(MAX) NULL,
    SearchDate DATETIME NOT NULL DEFAULT GETDATE(),
    IPAddress NVARCHAR(45) NULL,
    CONSTRAINT FK_SearchHistory_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO
-- UserSavedSearches table
CREATE TABLE UserSavedSearches (
    SavedSearchID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    SearchName NVARCHAR(100) NOT NULL,
    SearchParameters NVARCHAR(MAX) NOT NULL,
    LastUsed DATETIME NULL,
    NotificationFrequency NVARCHAR(20) NULL, -- Daily, Weekly, Monthly, None
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_UserSavedSearches_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO
-- AnalyticsEvents table
CREATE TABLE AnalyticsEvents (
    EventID INT IDENTITY(1,1) PRIMARY KEY,
    EventType NVARCHAR(50) NOT NULL,
    UserID INT NULL,
    SessionID UNIQUEIDENTIFIER NULL,
    EventData NVARCHAR(MAX) NULL,
    IPAddress NVARCHAR(45) NULL,
    UserAgent NVARCHAR(255) NULL,
    EventDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_AnalyticsEvents_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO



/*
============================================================
07_ System Administration.sql
============================================================
*/

-- Section 7: System Administration

-- SystemSettings table
CREATE TABLE SystemSettings (
    SettingID INT IDENTITY(1,1) PRIMARY KEY,
    SettingKey NVARCHAR(100) NOT NULL,
    SettingValue NVARCHAR(MAX) NULL,
    Description NVARCHAR(255) NULL,
    IsPublic BIT NOT NULL DEFAULT 0,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_SystemSettings_SettingKey UNIQUE (SettingKey)
);
GO
-- AuditLogs table
CREATE TABLE AuditLogs (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL,
    ActionType NVARCHAR(50) NOT NULL,
    TableName NVARCHAR(100) NOT NULL,
    RecordID NVARCHAR(100) NOT NULL,
    OldValues NVARCHAR(MAX) NULL,
    NewValues NVARCHAR(MAX) NULL,
    IPAddress NVARCHAR(45) NULL,
    ActionDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_AuditLogs_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO
-- ErrorLogs table
CREATE TABLE ErrorLogs (
    ErrorID INT IDENTITY(1,1) PRIMARY KEY,
    ErrorTime DATETIME NOT NULL DEFAULT GETDATE(),
    ErrorMessage NVARCHAR(MAX) NOT NULL,
    ErrorType NVARCHAR(255) NOT NULL,
    ErrorSource NVARCHAR(255) NULL,
    StackTrace NVARCHAR(MAX) NULL,
    InnerException NVARCHAR(MAX) NULL,
    UserID INT NULL,
    IPAddress NVARCHAR(45) NULL,
    CONSTRAINT FK_ErrorLogs_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO
-- EmailTemplates table
CREATE TABLE EmailTemplates (
    TemplateID INT IDENTITY(1,1) PRIMARY KEY,
    TemplateName NVARCHAR(100) NOT NULL,
    Subject NVARCHAR(255) NOT NULL,
    Body NVARCHAR(MAX) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_EmailTemplates_TemplateName UNIQUE (TemplateName)
);
GO
-- SentEmails table
CREATE TABLE SentEmails (
    EmailID INT IDENTITY(1,1) PRIMARY KEY,
    TemplateID INT NULL,
    RecipientEmail NVARCHAR(255) NOT NULL,
    Subject NVARCHAR(255) NOT NULL,
    Body NVARCHAR(MAX) NOT NULL,
    SentDate DATETIME NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(20) NOT NULL, -- Sent, Delivered, Failed
    ErrorMessage NVARCHAR(MAX) NULL,
    CONSTRAINT FK_SentEmails_TemplateID FOREIGN KEY (TemplateID) REFERENCES EmailTemplates(TemplateID)
);
GO
-- MaintenanceWindows table
CREATE TABLE MaintenanceWindows (
    WindowID INT IDENTITY(1,1) PRIMARY KEY,
    StartTime DATETIME NOT NULL,
    EndTime DATETIME NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT CK_MaintenanceWindows_TimeRange CHECK (EndTime > StartTime)
);
GO



/*
============================================================
08_ Indexes for Performance.sql
============================================================
*/

-- Section 8: Indexes for Performance

-- Users table indexes
CREATE INDEX IX_Users_Email ON Users(Email);
GO
CREATE INDEX IX_Users_LastName_FirstName ON Users(LastName, FirstName);
GO
-- ServiceProviders table indexes
CREATE INDEX IX_ServiceProviders_TypeID ON ServiceProviders(TypeID);
GO
CREATE INDEX IX_ServiceProviders_UserID ON ServiceProviders(UserID);
GO
CREATE INDEX IX_ServiceProviders_IsActive ON ServiceProviders(IsActive) WHERE IsActive = 1;
GO
-- Bookings table indexes
CREATE INDEX IX_Bookings_UserID ON Bookings(UserID);
GO
CREATE INDEX IX_Bookings_EventTypeID ON Bookings(EventTypeID);
GO
CREATE INDEX IX_Bookings_StatusID ON Bookings(StatusID);
GO
CREATE INDEX IX_Bookings_EventDate ON Bookings(EventDate);
GO
-- Payments table indexes
CREATE INDEX IX_Payments_BookingID ON Payments(BookingID);
GO
CREATE INDEX IX_Payments_UserID ON Payments(UserID);
GO
CREATE INDEX IX_Payments_ProviderID ON Payments(ProviderID);
GO
CREATE INDEX IX_Payments_Status ON Payments(Status);
GO
-- ProviderReviews table indexes
CREATE INDEX IX_ProviderReviews_ProviderID ON ProviderReviews(ProviderID);
GO
CREATE INDEX IX_ProviderReviews_UserID ON ProviderReviews(UserID);
GO
CREATE INDEX IX_ProviderReviews_IsApproved ON ProviderReviews(IsApproved) WHERE IsApproved = 1;
GO
-- Spatial index for location-based searches
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProviderLocations' AND type = 'U')
BEGIN
    IF COL_LENGTH('ProviderLocations', 'Latitude') IS NOT NULL AND COL_LENGTH('ProviderLocations', 'Longitude') IS NOT NULL
    BEGIN
        -- Add geography column for spatial queries
        ALTER TABLE ProviderLocations ADD GeoLocation AS geography::Point(Latitude, Longitude, 4326);
GO
        -- Create spatial index
        CREATE SPATIAL INDEX SIX_ProviderLocations_GeoLocation ON ProviderLocations(GeoLocation);
GO
    END
END
GO



/*
============================================================
09_ Views.sql
============================================================
*/

-- Section 9: Views

-- vw_VenueSearchResults: Consolidated provider data for search
CREATE VIEW vw_ProviderSearchResults AS
SELECT 
    sp.ProviderID,
    sp.BusinessName,
    sp.BusinessDescription,
    pt.TypeName AS ProviderType,
    pt.Category AS ProviderCategory,
    pl.City,
    pl.StateProvince,
    pl.Country,
    pl.Latitude,
    pl.Longitude,
    ISNULL((SELECT AVG(CAST(pr.Rating AS DECIMAL(5,2))) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1), 0) AS AverageRating,
    ISNULL((SELECT COUNT(*) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1), 0) AS ReviewCount,
    sp.BasePrice,
    sp.IsFeatured,
    sp.IsVerified,
    (SELECT TOP 1 ImageURL FROM ProviderPortfolio pp WHERE pp.ProviderID = sp.ProviderID ORDER BY pp.IsFeatured DESC, pp.DisplayOrder) AS PrimaryImage
FROM 
    ServiceProviders sp
    INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
    LEFT JOIN ProviderLocations pl ON sp.ProviderID = pl.ProviderID AND pl.IsPrimary = 1
WHERE 
    sp.IsActive = 1;
GO
-- vw_UserBookings: All bookings for a user
CREATE VIEW vw_UserBookings AS
SELECT 
    b.BookingID,
    b.EventName,
    b.EventDate,
    b.StartTime,
    b.EndTime,
    b.GuestCount,
    b.TotalPrice,
    b.DepositAmount,
    b.DepositPaid,
    b.BalanceDueDate,
    bs.StatusName AS BookingStatus,
    et.TypeName AS EventType,
    u.FirstName + ' ' + u.LastName AS CustomerName,
    u.Email AS CustomerEmail,
    u.PhoneNumber AS CustomerPhone,
    DATEDIFF(DAY, GETDATE(), b.EventDate) AS DaysUntilEvent,
    (SELECT COUNT(*) FROM BookingProviders bp WHERE bp.BookingID = b.BookingID) AS ProviderCount
FROM 
    Bookings b
    INNER JOIN BookingStatuses bs ON b.StatusID = bs.StatusID
    INNER JOIN EventTypes et ON b.EventTypeID = et.EventTypeID
    INNER JOIN Users u ON b.UserID = u.UserID;
GO
-- vw_ProviderDashboard: Summary for service providers
CREATE VIEW vw_ProviderDashboard AS
SELECT 
    sp.ProviderID,
    sp.BusinessName,
    pt.TypeName AS ProviderType,
    u.FirstName + ' ' + u.LastName AS OwnerName,
    u.Email AS OwnerEmail,
    (SELECT COUNT(*) FROM Bookings b INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID WHERE bp.ProviderID = sp.ProviderID AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))) AS ActiveBookings,
    (SELECT COUNT(*) FROM Bookings b INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID WHERE bp.ProviderID = sp.ProviderID AND b.EventDate >= GETDATE() AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed'))) AS UpcomingBookings,
    (SELECT SUM(bp.Price) FROM Bookings b INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID WHERE bp.ProviderID = sp.ProviderID AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed')) AND YEAR(b.EventDate) = YEAR(GETDATE())) AS YTDRevenue,
    (SELECT AVG(CAST(pr.Rating AS DECIMAL(5,2))) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS AverageRating,
    (SELECT COUNT(*) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS ReviewCount,
    (SELECT COUNT(*) FROM Wishlists w WHERE w.ProviderID = sp.ProviderID) AS WishlistCount
FROM 
    ServiceProviders sp
    INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
    INNER JOIN Users u ON sp.UserID = u.UserID;
GO
-- vw_RevenueByProvider: Financial performance by provider
CREATE VIEW vw_RevenueByProvider AS
SELECT 
    sp.ProviderID,
    sp.BusinessName,
    pt.TypeName AS ProviderType,
    YEAR(b.EventDate) AS Year,
    MONTH(b.EventDate) AS Month,
    COUNT(DISTINCT b.BookingID) AS BookingCount,
    SUM(bp.Price) AS GrossRevenue,
    SUM(p.FeeAmount) AS FeesCollected,
    SUM(p.NetAmount) AS NetRevenue,
    (SELECT SUM(po.Amount) FROM Payouts po WHERE po.ProviderID = sp.ProviderID AND YEAR(po.PayoutDate) = YEAR(b.EventDate) AND MONTH(po.PayoutDate) = MONTH(b.EventDate)) AS Payouts
FROM 
    Bookings b
    INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
    INNER JOIN Payments p ON bp.BookingProviderID = p.BookingID AND p.ProviderID = bp.ProviderID
    INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
    INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
WHERE 
    p.Status = 'Completed'
GROUP BY 
    sp.ProviderID, sp.BusinessName, pt.TypeName, YEAR(b.EventDate), MONTH(b.EventDate);
GO
-- vw_AvailabilityCalendar: Visual representation of availability
-- Drop the view if it already exists
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_AvailabilityCalendar')
BEGIN
    DROP VIEW vw_AvailabilityCalendar;
END
GO

-- Create the view with reliable date generation
CREATE VIEW vw_AvailabilityCalendar AS
WITH DateRange AS (
    -- Generate dates for the next 365 days using a numbers table approach
    SELECT DATEADD(DAY, number, CAST(GETDATE() AS DATE)) AS CalendarDate
    FROM (
        SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 AS number
        FROM sys.objects a
        CROSS JOIN sys.objects b  -- Generates enough rows for 365 days
    ) AS numbers
    WHERE number <= 364  -- Next 365 days
)
SELECT 
    sp.ProviderID,
    sp.BusinessName,
    pt.TypeName AS ProviderType,
    dr.CalendarDate,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM ProviderBlackoutDates bd 
            WHERE bd.ProviderID = sp.ProviderID 
            AND dr.CalendarDate BETWEEN bd.StartDate AND bd.EndDate
        ) THEN 0
        WHEN EXISTS (
            SELECT 1 FROM Bookings b 
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            WHERE bp.ProviderID = sp.ProviderID 
            AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
            AND dr.CalendarDate = b.EventDate
        ) THEN 0
        WHEN EXISTS (
            SELECT 1 FROM ProviderAvailability pa 
            WHERE pa.ProviderID = sp.ProviderID 
            AND pa.DayOfWeek = DATEPART(WEEKDAY, dr.CalendarDate)
            AND pa.IsAvailable = 1
        ) THEN 1
        ELSE 0
    END AS IsAvailable
FROM 
    ServiceProviders sp
    CROSS JOIN DateRange dr
    INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
WHERE 
    sp.IsActive = 1;
GO
-- vw_CustomerFavorites: User's saved providers
CREATE VIEW vw_CustomerFavorites AS
SELECT 
    w.WishlistID,
    w.UserID,
    u.FirstName + ' ' + u.LastName AS CustomerName,
    w.ProviderID,
    sp.BusinessName,
    pt.TypeName AS ProviderType,
    (SELECT AVG(CAST(pr.Rating AS DECIMAL(5,2))) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS AverageRating,
    (SELECT COUNT(*) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS ReviewCount,
    sp.BasePrice,
    (SELECT TOP 1 ImageURL FROM ProviderPortfolio pp WHERE pp.ProviderID = sp.ProviderID ORDER BY pp.IsFeatured DESC, pp.DisplayOrder) AS PrimaryImage,
    w.CreatedDate AS AddedDate
FROM 
    Wishlists w
    INNER JOIN Users u ON w.UserID = u.UserID
    INNER JOIN ServiceProviders sp ON w.ProviderID = sp.ProviderID
    INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID;
GO
-- vw_TopRatedProviders: Highest rated providers
CREATE VIEW vw_TopRatedProviders AS
SELECT 
    sp.ProviderID,
    sp.BusinessName,
    pt.TypeName AS ProviderType,
    pt.Category AS ProviderCategory,
    AVG(CAST(pr.Rating AS DECIMAL(5,2))) AS AverageRating,
    COUNT(pr.ReviewID) AS ReviewCount,
    sp.BasePrice,
    (SELECT TOP 1 ImageURL FROM ProviderPortfolio pp WHERE pp.ProviderID = sp.ProviderID ORDER BY pp.IsFeatured DESC, pp.DisplayOrder) AS PrimaryImage,
    pl.City,
    pl.StateProvince,
    pl.Country
FROM 
    ServiceProviders sp
    INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
    INNER JOIN ProviderReviews pr ON sp.ProviderID = pr.ProviderID
    LEFT JOIN ProviderLocations pl ON sp.ProviderID = pl.ProviderID AND pl.IsPrimary = 1
WHERE 
    sp.IsActive = 1 AND pr.IsApproved = 1
GROUP BY 
    sp.ProviderID, sp.BusinessName, pt.TypeName, pt.Category, sp.BasePrice, pl.City, pl.StateProvince, pl.Country
HAVING 
    COUNT(pr.ReviewID) >= 5;
GO
-- vw_UpcomingBookings: Bookings in next 30 days
CREATE VIEW vw_UpcomingBookings AS
SELECT 
    b.BookingID,
    b.EventName,
    b.EventDate,
    b.StartTime,
    b.EndTime,
    b.GuestCount,
    u.FirstName + ' ' + u.LastName AS CustomerName,
    u.Email AS CustomerEmail,
    u.PhoneNumber AS CustomerPhone,
    et.TypeName AS EventType,
    bs.StatusName AS BookingStatus,
    DATEDIFF(DAY, GETDATE(), b.EventDate) AS DaysUntilEvent,
    (SELECT STRING_AGG(sp.BusinessName, ', ') 
     FROM BookingProviders bp 
     INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
     WHERE bp.BookingID = b.BookingID) AS Providers
FROM 
    Bookings b
    INNER JOIN Users u ON b.UserID = u.UserID
    INNER JOIN EventTypes et ON b.EventTypeID = et.EventTypeID
    INNER JOIN BookingStatuses bs ON b.StatusID = bs.StatusID
WHERE 
    b.EventDate BETWEEN GETDATE() AND DATEADD(DAY, 30, GETDATE())
    AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed'));
GO



/*
============================================================
10_ Stored Procedures - User Management.sql
============================================================
*/

-- Section 10: Stored Procedures - User Management

-- sp_User_Create: Register new users
CREATE PROCEDURE sp_User_Create
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255) = NULL,
    @PasswordSalt NVARCHAR(255) = NULL,
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100),
    @PhoneNumber NVARCHAR(20) = NULL,
    @AvatarURL NVARCHAR(255) = NULL,
    @DateOfBirth DATE = NULL,
    @RoleName NVARCHAR(50) = 'Customer',
    @IsSocialLogin BIT = 0,
    @UserID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Check if email already exists
        IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
        BEGIN
            IF @IsSocialLogin = 1
            BEGIN
                -- For social login, return existing user ID
                SELECT @UserID = UserID FROM Users WHERE Email = @Email;
            END
            ELSE
            BEGIN
                -- For regular registration, email must be unique
                THROW 50001, 'Email address is already registered.', 1;
            END
        END
        ELSE
        BEGIN
            -- Insert new user
            INSERT INTO Users (
                Email, PasswordHash, PasswordSalt, FirstName, LastName, 
                PhoneNumber, AvatarURL, DateOfBirth, EmailConfirmed, IsActive
            )
            VALUES (
                @Email, @PasswordHash, @PasswordSalt, @FirstName, @LastName, 
                @PhoneNumber, @AvatarURL, @DateOfBirth, CASE WHEN @IsSocialLogin = 1 THEN 1 ELSE 0 END, 1
            );

            SET @UserID = SCOPE_IDENTITY();

            -- Add user role
            DECLARE @RoleID INT;
            
            SELECT @RoleID = RoleID FROM UserRoles WHERE RoleName = @RoleName;
            
            IF @RoleID IS NULL
            BEGIN
                SET @RoleID = 3; -- Default to Customer if role not found
            END
            
            INSERT INTO UserRoleMappings (UserID, RoleID)
            VALUES (@UserID, @RoleID);
        END
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- sp_User_Authenticate: Handle login
CREATE PROCEDURE sp_User_Authenticate
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserID INT;
    DECLARE @IsLockedOut BIT;
    DECLARE @LockoutEndDate DATETIME;
    DECLARE @StoredHash NVARCHAR(255);
    DECLARE @StoredSalt NVARCHAR(255);
    
    -- Get user data
    SELECT 
        @UserID = UserID,
        @IsLockedOut = IsLockedOut,
        @LockoutEndDate = LockoutEndDate,
        @StoredHash = PasswordHash,
        @StoredSalt = PasswordSalt
    FROM Users 
    WHERE Email = @Email;
    
    -- Check if account exists
    IF @UserID IS NULL
    BEGIN
        RAISERROR('Invalid email or password.', 16, 1);
        RETURN;
    END
    
    -- Check if account is locked
    IF @IsLockedOut = 1 AND (@LockoutEndDate IS NULL OR @LockoutEndDate > GETDATE())
    BEGIN
        RAISERROR('Account is temporarily locked. Please try again later or reset your password.', 16, 1);
        RETURN;
    END
    
    -- Verify password
    IF @StoredHash IS NULL OR @StoredHash <> @PasswordHash
    BEGIN
        -- Increment failed login attempt
        UPDATE Users 
        SET FailedLoginAttempts = FailedLoginAttempts + 1,
            IsLockedOut = CASE WHEN FailedLoginAttempts + 1 >= 5 THEN 1 ELSE 0 END,
            LockoutEndDate = CASE WHEN FailedLoginAttempts + 1 >= 5 THEN DATEADD(MINUTE, 30, GETDATE()) ELSE NULL END
        WHERE UserID = @UserID;
        
        RAISERROR('Invalid email or password.', 16, 1);
        RETURN;
    END
    
    -- Successful login - reset failed attempts and update last login
    UPDATE Users 
    SET FailedLoginAttempts = 0,
        IsLockedOut = 0,
        LockoutEndDate = NULL,
        LastLoginDate = GETDATE()
    WHERE UserID = @UserID;
    
    -- Return user data
    SELECT 
        u.UserID,
        u.Email,
        u.FirstName,
        u.LastName,
        u.PhoneNumber,
        u.AvatarURL,
        u.TwoFactorEnabled,
        r.RoleName
    FROM Users u
    INNER JOIN UserRoleMappings m ON u.UserID = m.UserID
    INNER JOIN UserRoles r ON m.RoleID = r.RoleID
    WHERE u.UserID = @UserID;
END;
GO

-- sp_User_UpdateProfile: Update user information
CREATE PROCEDURE sp_User_UpdateProfile
    @UserID INT,
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100),
    @PhoneNumber NVARCHAR(20) = NULL,
    @AvatarURL NVARCHAR(255) = NULL,
    @DateOfBirth DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Users
    SET 
        FirstName = @FirstName,
        LastName = @LastName,
        PhoneNumber = @PhoneNumber,
        AvatarURL = @AvatarURL,
        DateOfBirth = @DateOfBirth,
        ModifiedDate = GETDATE()
    WHERE UserID = @UserID;
    
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('User not found.', 16, 1);
    END
END;
GO

-- sp_User_ResetPassword: Password reset functionality
CREATE PROCEDURE sp_User_ResetPassword
    @Email NVARCHAR(255),
    @NewPasswordHash NVARCHAR(255),
    @NewPasswordSalt NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Users
    SET 
        PasswordHash = @NewPasswordHash,
        PasswordSalt = @NewPasswordSalt,
        FailedLoginAttempts = 0,
        IsLockedOut = 0,
        LockoutEndDate = NULL,
        ModifiedDate = GETDATE()
    WHERE Email = @Email;
    
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('User not found.', 16, 1);
    END
END;
GO

-- sp_User_GetFavorites: Retrieve user's saved providers
CREATE PROCEDURE sp_User_GetFavorites
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        w.WishlistID,
        w.ProviderID,
        sp.BusinessName,
        pt.TypeName AS ProviderType,
        (SELECT AVG(CAST(pr.Rating AS DECIMAL(5,2))) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS AverageRating,
        (SELECT COUNT(*) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS ReviewCount,
        sp.BasePrice,
        (SELECT TOP 1 ImageURL FROM ProviderPortfolio pp WHERE pp.ProviderID = sp.ProviderID ORDER BY pp.IsFeatured DESC, pp.DisplayOrder) AS PrimaryImage,
        w.CreatedDate AS AddedDate
    FROM 
        Wishlists w
        INNER JOIN ServiceProviders sp ON w.ProviderID = sp.ProviderID
        INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
    WHERE 
        w.UserID = @UserID
    ORDER BY 
        w.CreatedDate DESC;
END;
GO

-- sp_UserSocialLogin_CreateOrUpdate: Handle social login registration/authentication
CREATE PROCEDURE sp_UserSocialLogin_CreateOrUpdate
    @ProviderName NVARCHAR(50),
    @ProviderKey NVARCHAR(255),
    @Email NVARCHAR(255),
    @FirstName NVARCHAR(100) = NULL,
    @LastName NVARCHAR(100) = NULL,
    @ProfilePictureURL NVARCHAR(255) = NULL,
    @AccessToken NVARCHAR(MAX),
    @RefreshToken NVARCHAR(MAX) = NULL,
    @TokenExpiration DATETIME = NULL,
    @UserID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ProviderID INT;
    
    -- Get provider ID
    SELECT @ProviderID = ProviderID 
    FROM SocialLoginProviders 
    WHERE ProviderName = @ProviderName;
    
    IF @ProviderID IS NULL
    BEGIN
        RAISERROR('Social login provider not supported.', 16, 1);
        RETURN;
    END
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Check if social login already exists
        DECLARE @ExistingUserID INT;
        
        SELECT @ExistingUserID = UserID 
        FROM UserSocialLogins 
        WHERE ProviderID = @ProviderID AND ProviderKey = @ProviderKey;
        
        IF @ExistingUserID IS NOT NULL
        BEGIN
            -- Update existing social login
            UPDATE UserSocialLogins
            SET 
                Email = @Email,
                FirstName = @FirstName,
                LastName = @LastName,
                ProfilePictureURL = @ProfilePictureURL,
                AccessToken = @AccessToken,
                RefreshToken = @RefreshToken,
                TokenExpiration = @TokenExpiration,
                LastLoginDate = GETDATE()
            WHERE 
                ProviderID = @ProviderID AND ProviderKey = @ProviderKey;
                
            SET @UserID = @ExistingUserID;
            
            -- Update user's last login
            UPDATE Users
            SET LastLoginDate = GETDATE()
            WHERE UserID = @UserID;
        END
        ELSE
        BEGIN
            -- Check if email exists in users table
            SELECT @UserID = UserID 
            FROM Users 
            WHERE Email = @Email;
            
            -- Create new user if not exists
            IF @UserID IS NULL
            BEGIN
                EXEC sp_User_Create 
                    @Email = @Email,
                    @FirstName = @FirstName,
                    @LastName = @LastName,
                    @AvatarURL = @ProfilePictureURL,
                    @IsSocialLogin = 1,
                    @UserID = @UserID OUTPUT;
            END
            
            -- Add social login
            INSERT INTO UserSocialLogins (
                UserID, ProviderID, ProviderKey, Email, FirstName, LastName, 
                ProfilePictureURL, AccessToken, RefreshToken, TokenExpiration
            )
            VALUES (
                @UserID, @ProviderID, @ProviderKey, @Email, @FirstName, @LastName, 
                @ProfilePictureURL, @AccessToken, @RefreshToken, @TokenExpiration
            );
            
            -- Update user's last login
            UPDATE Users
            SET 
                LastLoginDate = GETDATE(),
                AvatarURL = ISNULL(AvatarURL, @ProfilePictureURL)
            WHERE UserID = @UserID;
        END
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- sp_User_GetSocialLogins: Get all social logins for a user
CREATE PROCEDURE sp_User_GetSocialLogins
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        usl.UserSocialLoginID,
        slp.ProviderName,
        usl.Email,
        usl.FirstName,
        usl.LastName,
        usl.ProfilePictureURL,
        usl.DateLinked,
        usl.LastLoginDate
    FROM 
        UserSocialLogins usl
        INNER JOIN SocialLoginProviders slp ON usl.ProviderID = slp.ProviderID
    WHERE 
        usl.UserID = @UserID;
END;
GO

-- sp_UserSocialLogin_Unlink: Remove social login association
CREATE PROCEDURE sp_UserSocialLogin_Unlink
    @UserID INT,
    @ProviderName NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ProviderID INT;
    
    -- Get provider ID
    SELECT @ProviderID = ProviderID 
    FROM SocialLoginProviders 
    WHERE ProviderName = @ProviderName;
    
    IF @ProviderID IS NULL
    BEGIN
        RAISERROR('Social login provider not supported.', 16, 1);
        RETURN;
    END
    
    -- Check if user has other login methods
    DECLARE @PasswordHash NVARCHAR(255);
    DECLARE @SocialLoginCount INT;
    
    SELECT @PasswordHash = PasswordHash FROM Users WHERE UserID = @UserID;
    
    SELECT @SocialLoginCount = COUNT(*) FROM UserSocialLogins WHERE UserID = @UserID;
    
    -- User must have at least one login method
    IF @PasswordHash IS NULL AND @SocialLoginCount <= 1
    BEGIN
        RAISERROR('Cannot unlink the only login method. Please set a password first.', 16, 1);
        RETURN;
    END
    
    -- Remove social login
    DELETE FROM UserSocialLogins 
    WHERE UserID = @UserID AND ProviderID = @ProviderID;
END;
GO



/*
============================================================
11_ Stored Procedures - Provider Management.sql
============================================================
*/

-- Section 11: Stored Procedures - Provider Management

-- sp_Provider_Search: Search providers with filters
CREATE PROCEDURE sp_Provider_Search
    @SearchTerm NVARCHAR(100) = NULL,
    @ProviderTypeID INT = NULL,
    @Category NVARCHAR(50) = NULL,
    @Location NVARCHAR(100) = NULL,
    @Latitude DECIMAL(10, 8) = NULL,
    @Longitude DECIMAL(11, 8) = NULL,
    @RadiusMiles INT = NULL,
    @MinPrice DECIMAL(18, 2) = NULL,
    @MaxPrice DECIMAL(18, 2) = NULL,
    @MinRating DECIMAL(3, 2) = NULL,
    @EventDate DATE = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @SortBy NVARCHAR(50) = 'rating',
    @SortDirection NVARCHAR(4) = 'DESC'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    -- Create temp table for results
    CREATE TABLE #SearchResults (
        ProviderID INT,
        BusinessName NVARCHAR(255),
        BusinessDescription NVARCHAR(MAX),
        ProviderType NVARCHAR(100),
        Category NVARCHAR(50),
        City NVARCHAR(100),
        StateProvince NVARCHAR(100),
        Country NVARCHAR(100),
        Latitude DECIMAL(10, 8),
        Longitude DECIMAL(11, 8),
        AverageRating DECIMAL(5,2),
        ReviewCount INT,
        BasePrice DECIMAL(18, 2),
        PrimaryImage NVARCHAR(255),
        DistanceMiles FLOAT,
        IsAvailable BIT,
        RowNum INT
    );

    -- Insert base results
    INSERT INTO #SearchResults (
        ProviderID, BusinessName, BusinessDescription, ProviderType, Category,
        City, StateProvince, Country, Latitude, Longitude, AverageRating,
        ReviewCount, BasePrice, PrimaryImage
    )
    SELECT 
        sp.ProviderID,
        sp.BusinessName,
        sp.BusinessDescription,
        pt.TypeName AS ProviderType,
        pt.Category,
        pl.City,
        pl.StateProvince,
        pl.Country,
        pl.Latitude,
        pl.Longitude,
        ISNULL((SELECT AVG(CAST(pr.Rating AS DECIMAL(5,2))) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1), 0) AS AverageRating,
        ISNULL((SELECT COUNT(*) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1), 0) AS ReviewCount,
        sp.BasePrice,
        (SELECT TOP 1 ImageURL FROM ProviderPortfolio pp WHERE pp.ProviderID = sp.ProviderID ORDER BY pp.IsFeatured DESC, pp.DisplayOrder) AS PrimaryImage
    FROM 
        ServiceProviders sp
        INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
        LEFT JOIN ProviderLocations pl ON sp.ProviderID = pl.ProviderID AND pl.IsPrimary = 1
    WHERE 
        sp.IsActive = 1
        AND (@ProviderTypeID IS NULL OR sp.TypeID = @ProviderTypeID)
        AND (@Category IS NULL OR pt.Category = @Category)
        AND (@SearchTerm IS NULL OR sp.BusinessName LIKE '%' + @SearchTerm + '%' OR sp.BusinessDescription LIKE '%' + @SearchTerm + '%')
        AND (@Location IS NULL OR pl.City LIKE '%' + @Location + '%' OR pl.StateProvince LIKE '%' + @Location + '%');

    -- Calculate distance if location provided
    IF @Latitude IS NOT NULL AND @Longitude IS NOT NULL
    BEGIN
        UPDATE #SearchResults
        SET DistanceMiles = geography::Point(Latitude, Longitude, 4326).STDistance(geography::Point(@Latitude, @Longitude, 4326)) * 0.000621371 -- Convert meters to miles
        WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL;

        -- Filter by radius if specified
        IF @RadiusMiles IS NOT NULL
        BEGIN
            DELETE FROM #SearchResults
            WHERE DistanceMiles > @RadiusMiles OR DistanceMiles IS NULL;
        END
    END
    
    -- Filter by price range
    IF @MinPrice IS NOT NULL
    BEGIN
        DELETE FROM #SearchResults
        WHERE BasePrice < @MinPrice OR BasePrice IS NULL;
    END
    
    IF @MaxPrice IS NOT NULL
    BEGIN
        DELETE FROM #SearchResults
        WHERE BasePrice > @MaxPrice;
    END
    
    -- Filter by rating
    IF @MinRating IS NOT NULL
    BEGIN
        DELETE FROM #SearchResults
        WHERE AverageRating < @MinRating OR ReviewCount = 0;
    END
    
    -- Check availability for specific date
    IF @EventDate IS NOT NULL
    BEGIN
        UPDATE sr
        SET sr.IsAvailable = CASE 
            WHEN EXISTS (
                SELECT 1 FROM ProviderBlackoutDates bd 
                WHERE bd.ProviderID = sr.ProviderID 
                AND @EventDate BETWEEN bd.StartDate AND bd.EndDate
            ) THEN 0
            WHEN EXISTS (
                SELECT 1 FROM Bookings b 
                INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
                WHERE bp.ProviderID = sr.ProviderID 
                AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
                AND @EventDate = b.EventDate
            ) THEN 0
            WHEN EXISTS (
                SELECT 1 FROM ProviderAvailability pa 
                WHERE pa.ProviderID = sr.ProviderID 
                AND pa.DayOfWeek = DATEPART(WEEKDAY, @EventDate)
                AND pa.IsAvailable = 1
            ) THEN 1
            ELSE 0
        END
        FROM #SearchResults sr;

        -- Remove unavailable providers
        DELETE FROM #SearchResults
        WHERE IsAvailable = 0;
    END
    
    -- Apply sorting
    DECLARE @SortSQL NVARCHAR(MAX);
    SET @SortSQL = N'
    UPDATE #SearchResults
    SET RowNum = ROW_NUMBER() OVER (ORDER BY ' + 
        CASE @SortBy
            WHEN 'price' THEN 'BasePrice'
            WHEN 'name' THEN 'BusinessName'
            WHEN 'distance' THEN 'DistanceMiles'
            ELSE 'AverageRating'
        END + ' ' + @SortDirection + ')';
    EXEC sp_executesql @SortSQL;

    -- Return paginated results
    SELECT 
        ProviderID,
        BusinessName,
        BusinessDescription,
        ProviderType,
        Category,
        City,
        StateProvince,
        Country,
        Latitude,
        Longitude,
        AverageRating,
        ReviewCount,
        BasePrice,
        PrimaryImage,
        DistanceMiles,
        (SELECT COUNT(*) FROM #SearchResults) AS TotalCount
    FROM 
        #SearchResults
    WHERE 
        RowNum > @Offset AND RowNum <= @Offset + @PageSize
    ORDER BY 
        RowNum;

    DROP TABLE #SearchResults;
END;
GO

-- sp_Provider_Create: Add new provider
CREATE PROCEDURE sp_Provider_Create
    @UserID INT,
    @BusinessName NVARCHAR(255),
    @BusinessDescription NVARCHAR(MAX),
    @TypeID INT,
    @YearsExperience INT = NULL,
    @IsMobile BIT = 0,
    @TravelRadius INT = NULL,
    @BasePrice DECIMAL(18, 2) = NULL,
    @MinEventSize INT = NULL,
    @MaxEventSize INT = NULL,
    @IsInsured BIT = 0,
    @InsuranceDetails NVARCHAR(255) = NULL,
    @ProviderID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Insert new provider
        INSERT INTO ServiceProviders (
            UserID, BusinessName, BusinessDescription, TypeID, YearsExperience,
            IsMobile, TravelRadius, BasePrice, MinEventSize, MaxEventSize,
            IsInsured, InsuranceDetails, IsActive
        )
        VALUES (
            @UserID, @BusinessName, @BusinessDescription, @TypeID, @YearsExperience,
            @IsMobile, @TravelRadius, @BasePrice, @MinEventSize, @MaxEventSize,
            @IsInsured, @InsuranceDetails, 1
        );

        SET @ProviderID = SCOPE_IDENTITY();

        -- Update user role to include provider role if not already set
        IF NOT EXISTS (
            SELECT 1 FROM UserRoleMappings urm
            INNER JOIN UserRoles ur ON urm.RoleID = ur.RoleID
            WHERE urm.UserID = @UserID AND ur.RoleName IN ('VenueOwner', 'ServiceProvider')
        )
        BEGIN
            DECLARE @ProviderRoleID INT;

            -- Try to get ServiceProvider role first
            SELECT @ProviderRoleID = RoleID 
            FROM UserRoles 
            WHERE RoleName = 'ServiceProvider';

            -- Fallback to VenueOwner if ServiceProvider doesn't exist
            IF @ProviderRoleID IS NULL
            BEGIN
                SELECT @ProviderRoleID = RoleID 
                FROM UserRoles 
                WHERE RoleName = 'VenueOwner';
            END
            
            -- If neither exists, create ServiceProvider role
            IF @ProviderRoleID IS NULL
            BEGIN
                INSERT INTO UserRoles (RoleName, Description, IsActive)
                VALUES ('ServiceProvider', 'Service provider account', 1);
                SET @ProviderRoleID = SCOPE_IDENTITY();
            END
            
            -- Add role mapping
            INSERT INTO UserRoleMappings (UserID, RoleID)
            VALUES (@UserID, @ProviderRoleID);
        END
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- sp_Provider_Update: Modify provider details
CREATE PROCEDURE sp_Provider_Update
    @ProviderID INT,
    @BusinessName NVARCHAR(255),
    @BusinessDescription NVARCHAR(MAX),
    @TypeID INT,
    @YearsExperience INT = NULL,
    @IsMobile BIT = 0,
    @TravelRadius INT = NULL,
    @BasePrice DECIMAL(18, 2) = NULL,
    @MinEventSize INT = NULL,
    @MaxEventSize INT = NULL,
    @IsInsured BIT = 0,
    @InsuranceDetails NVARCHAR(255) = NULL,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ServiceProviders
    SET 
        BusinessName = @BusinessName,
        BusinessDescription = @BusinessDescription,
        TypeID = @TypeID,
        YearsExperience = @YearsExperience,
        IsMobile = @IsMobile,
        TravelRadius = @TravelRadius,
        BasePrice = @BasePrice,
        MinEventSize = @MinEventSize,
        MaxEventSize = @MaxEventSize,
        IsInsured = @IsInsured,
        InsuranceDetails = @InsuranceDetails,
        IsActive = @IsActive,
        LastUpdated = GETDATE()
    WHERE 
        ProviderID = @ProviderID;

    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Provider not found.', 16, 1);
    END
END;
GO

-- sp_Provider_GetFullProfile: Get complete provider details
CREATE PROCEDURE sp_Provider_GetFullProfile
    @ProviderID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Basic provider info
    SELECT 
        sp.ProviderID,
        sp.BusinessName,
        sp.BusinessDescription,
        pt.TypeID,
        pt.TypeName AS ProviderType,
        pt.Category AS ProviderCategory,
        sp.YearsExperience,
        sp.IsMobile,
        sp.TravelRadius,
        sp.BasePrice,
        sp.MinEventSize,
        sp.MaxEventSize,
        sp.IsInsured,
        sp.InsuranceDetails,
        sp.IsFeatured,
        sp.IsVerified,
        sp.IsActive,
        u.FirstName + ' ' + u.LastName AS OwnerName,
        u.Email AS OwnerEmail,
        u.PhoneNumber AS OwnerPhone,
        u.AvatarURL AS OwnerAvatar,
        (SELECT AVG(CAST(pr.Rating AS DECIMAL(5,2))) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS AverageRating,
        (SELECT COUNT(*) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS ReviewCount
    FROM 
        ServiceProviders sp
        INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
        INNER JOIN Users u ON sp.UserID = u.UserID
    WHERE 
        sp.ProviderID = @ProviderID;

    -- Location info
    SELECT 
        LocationID,
        AddressLine1,
        AddressLine2,
        City,
        StateProvince,
        PostalCode,
        Country,
        Latitude,
        Longitude,
        IsPrimary
    FROM 
        ProviderLocations
    WHERE 
        ProviderID = @ProviderID
    ORDER BY 
        IsPrimary DESC;

    -- Services
    SELECT 
        ProviderServiceID,
        ServiceName,
        Description,
        BasePrice,
        PriceType,
        MinDuration,
        IsActive
    FROM 
        ProviderServices
    WHERE 
        ProviderID = @ProviderID
    ORDER BY 
        ServiceName;

    -- Service packages
    SELECT 
        PackageID,
        PackageName,
        Description,
        Price,
        IncludedServices,
        IsActive
    FROM 
        ProviderServicePackages
    WHERE 
        ProviderID = @ProviderID
    ORDER BY 
        PackageName;

    -- Availability
    SELECT 
        AvailabilityID,
        DayOfWeek,
        StartTime,
        EndTime,
        IsAvailable,
        Notes
    FROM 
        ProviderAvailability
    WHERE 
        ProviderID = @ProviderID
    ORDER BY 
        DayOfWeek, StartTime;

    -- Blackout dates
    SELECT 
        BlackoutID,
        StartDate,
        EndDate,
        Reason,
        IsRecurring,
        RecurrencePattern
    FROM 
        ProviderBlackoutDates
    WHERE 
        ProviderID = @ProviderID
        AND (EndDate >= GETDATE() OR IsRecurring = 1)
    ORDER BY 
        StartDate;

    -- Equipment
    SELECT 
        EquipmentID,
        EquipmentName,
        Description,
        Quantity,
        IncludedInBasePrice
    FROM 
        ProviderEquipment
    WHERE 
        ProviderID = @ProviderID
    ORDER BY 
        EquipmentName;

    -- Portfolio items
    SELECT 
        PortfolioID,
        Title,
        Description,
        ImageURL,
        VideoURL,
        DisplayOrder,
        IsFeatured
    FROM 
        ProviderPortfolio
    WHERE 
        ProviderID = @ProviderID
    ORDER BY 
        IsFeatured DESC, DisplayOrder;

    -- Reviews
    SELECT 
        pr.ReviewID,
        pr.Rating,
        pr.ReviewText,
        pr.ReviewDate,
        pr.ResponseText,
        pr.ResponseDate,
        u.UserID,
        u.FirstName + ' ' + u.LastName AS ReviewerName,
        u.AvatarURL AS ReviewerAvatar,
        b.EventName,
        b.EventDate
    FROM 
        ProviderReviews pr
        INNER JOIN Users u ON pr.UserID = u.UserID
        LEFT JOIN Bookings b ON pr.BookingID = b.BookingID
    WHERE 
        pr.ProviderID = @ProviderID
        AND pr.IsApproved = 1
    ORDER BY 
        pr.ReviewDate DESC;

    -- Detailed review categories
    IF EXISTS (SELECT 1 FROM ReviewCategories rc INNER JOIN ProviderTypes pt ON rc.ProviderTypeID = pt.TypeID INNER JOIN ServiceProviders sp ON pt.TypeID = sp.TypeID WHERE sp.ProviderID = @ProviderID)
    BEGIN
        -- Get average ratings by category
        SELECT 
            rc.CategoryID,
            rc.CategoryName,
            rc.Description,
            AVG(CAST(rcr.Rating AS DECIMAL(5,2))) AS AverageRating,
            COUNT(rcr.RatingID) AS RatingCount
        FROM 
            ReviewCategories rc
            LEFT JOIN ReviewCategoryRatings rcr ON rc.CategoryID = rcr.CategoryID
            LEFT JOIN ProviderReviews pr ON rcr.ReviewID = pr.ReviewID AND pr.ProviderID = @ProviderID
        WHERE 
            rc.ProviderTypeID = (SELECT TypeID FROM ServiceProviders WHERE ProviderID = @ProviderID)
        GROUP BY 
            rc.CategoryID, rc.CategoryName, rc.Description
        ORDER BY 
            rc.CategoryName;
    END
END;
GO

-- sp_Provider_GetAvailability: Check availability for a provider
CREATE PROCEDURE sp_Provider_GetAvailability
    @ProviderID INT,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate date range
    IF @EndDate < @StartDate
    BEGIN
        RAISERROR('End date must be after start date.', 16, 1);
        RETURN;
    END
    
    -- Create temp table for dates
    CREATE TABLE #DateRange (
        DateValue DATE
    );
    
    -- Populate date range
    DECLARE @CurrentDate DATE = @StartDate;
    WHILE @CurrentDate <= @EndDate
    BEGIN
        INSERT INTO #DateRange (DateValue) VALUES (@CurrentDate);
        SET @CurrentDate = DATEADD(DAY, 1, @CurrentDate);
    END
    
    -- Get provider's weekly availability
    DECLARE @WeeklyAvailability TABLE (
        DayOfWeek TINYINT,
        StartTime TIME,
        EndTime TIME,
        IsAvailable BIT
    );
    
    INSERT INTO @WeeklyAvailability
    SELECT 
        DayOfWeek,
        StartTime,
        EndTime,
        IsAvailable
    FROM 
        ProviderAvailability
    WHERE 
        ProviderID = @ProviderID;
    
    -- Get blackout dates
    DECLARE @BlackoutDates TABLE (
        StartDate DATE,
        EndDate DATE
    );
    
    INSERT INTO @BlackoutDates
    SELECT 
        StartDate,
        EndDate
    FROM 
        ProviderBlackoutDates
    WHERE 
        ProviderID = @ProviderID
        AND (
            (StartDate <= @EndDate AND EndDate >= @StartDate) OR
            IsRecurring = 1
        );
    
    -- Get booked dates
    DECLARE @BookedDates TABLE (
        EventDate DATE,
        StartTime TIME,
        EndTime TIME
    );
    
    INSERT INTO @BookedDates
    SELECT 
        b.EventDate,
        b.StartTime,
        b.EndTime
    FROM 
        Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
    WHERE 
        bp.ProviderID = @ProviderID
        AND b.EventDate BETWEEN @StartDate AND @EndDate
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'));
    
    -- Return availability for each date
    SELECT 
        dr.DateValue,
        wa.DayOfWeek,
        wa.StartTime AS DefaultStartTime,
        wa.EndTime AS DefaultEndTime,
        wa.IsAvailable AS DefaultAvailable,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM @BlackoutDates bd 
                WHERE dr.DateValue BETWEEN bd.StartDate AND bd.EndDate
            ) THEN 0
            WHEN EXISTS (
                SELECT 1 FROM @BookedDates bd 
                WHERE bd.EventDate = dr.DateValue
            ) THEN 0
            WHEN EXISTS (
                SELECT 1 FROM @WeeklyAvailability wa2 
                WHERE wa2.DayOfWeek = DATEPART(WEEKDAY, dr.DateValue) 
                AND wa2.IsAvailable = 1
            ) THEN 1
            ELSE 0
        END AS IsAvailable,
        (
            SELECT STRING_AGG(CONVERT(NVARCHAR(5), bd.StartTime) + ' - ' + CONVERT(NVARCHAR(5), bd.EndTime), ', ')
            FROM @BookedDates bd 
            WHERE bd.EventDate = dr.DateValue
        ) AS BookedSlots,
        (
            SELECT TOP 1 bd.Reason 
            FROM ProviderBlackoutDates bd 
            WHERE dr.DateValue BETWEEN bd.StartDate AND bd.EndDate
            AND bd.ProviderID = @ProviderID
        ) AS BlackoutReason
    FROM 
        #DateRange dr
        LEFT JOIN @WeeklyAvailability wa ON wa.DayOfWeek = DATEPART(WEEKDAY, dr.DateValue)
    ORDER BY 
        dr.DateValue;

    DROP TABLE #DateRange;
END;
GO

-- sp_Provider_CalculatePrice: Dynamic pricing calculation
CREATE PROCEDURE sp_Provider_CalculatePrice
    @ProviderID INT,
    @EventDate DATE,
    @StartTime TIME,
    @EndTime TIME,
    @GuestCount INT = NULL,
    @ServiceIDs NVARCHAR(MAX) = NULL, -- JSON array of service IDs
    @PackageID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @BasePrice DECIMAL(18, 2) = 0;
    DECLARE @TotalPrice DECIMAL(18, 2) = 0;
    DECLARE @DurationHours DECIMAL(10, 2);
    DECLARE @IsAvailable BIT = 1;
    DECLARE @Message NVARCHAR(255) = '';
    
    -- Calculate duration in hours
    SET @DurationHours = DATEDIFF(MINUTE, @StartTime, @EndTime) / 60.0;
    
    -- Get provider base price
    SELECT @BasePrice = BasePrice 
    FROM ServiceProviders 
    WHERE ProviderID = @ProviderID;
    
    -- Check if provider has pricing tiers for this date
    DECLARE @PriceMultiplier DECIMAL(5, 2) = 1.0;
    
    SELECT @PriceMultiplier = PriceMultiplier
    FROM PricingTiers
    WHERE 
        (ProviderID = @ProviderID OR ProviderTypeID = (SELECT TypeID FROM ServiceProviders WHERE ProviderID = @ProviderID))
        AND @EventDate BETWEEN StartDate AND EndDate
        AND IsActive = 1
    ORDER BY 
        ProviderID DESC, -- Prefer provider-specific over type-specific
        PriceMultiplier DESC
    OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY;
    
    SET @BasePrice = @BasePrice * @PriceMultiplier;
    
    -- Check availability
    DECLARE @DayOfWeek TINYINT = DATEPART(WEEKDAY, @EventDate);
    
    -- Check blackout dates
    IF EXISTS (
        SELECT 1 FROM ProviderBlackoutDates 
        WHERE ProviderID = @ProviderID 
        AND @EventDate BETWEEN StartDate AND EndDate
    )
    BEGIN
        SET @IsAvailable = 0;
        SET @Message = 'Provider is not available on this date (blackout).';
    END
    
    -- Check weekly availability
    IF @IsAvailable = 1 AND NOT EXISTS (
        SELECT 1 FROM ProviderAvailability 
        WHERE ProviderID = @ProviderID 
        AND DayOfWeek = @DayOfWeek 
        AND IsAvailable = 1
        AND @StartTime >= StartTime 
        AND @EndTime <= EndTime
    )
    BEGIN
        SET @IsAvailable = 0;
        SET @Message = 'Provider is not available at the requested time.';
    END
    
    -- Check existing bookings
    IF @IsAvailable = 1 AND EXISTS (
        SELECT 1 FROM Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
        WHERE bp.ProviderID = @ProviderID
        AND b.EventDate = @EventDate
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        AND (
            (@StartTime >= b.StartTime AND @StartTime < b.EndTime) OR
            (@EndTime > b.StartTime AND @EndTime <= b.EndTime) OR
            (@StartTime <= b.StartTime AND @EndTime >= b.EndTime)
        )
    )
    BEGIN
        SET @IsAvailable = 0;
        SET @Message = 'Provider is already booked at the requested time.';
    END
    
    -- Check guest count against provider limits
    DECLARE @MinEventSize INT, @MaxEventSize INT;
    
    SELECT 
        @MinEventSize = MinEventSize,
        @MaxEventSize = MaxEventSize
    FROM ServiceProviders
    WHERE ProviderID = @ProviderID;
    
    IF @GuestCount IS NOT NULL
    BEGIN
        IF @MinEventSize IS NOT NULL AND @GuestCount < @MinEventSize
        BEGIN
            SET @IsAvailable = 0;
            SET @Message = 'Guest count is below provider minimum of ' + CAST(@MinEventSize AS NVARCHAR(10));
        END
        
        IF @MaxEventSize IS NOT NULL AND @GuestCount > @MaxEventSize
        BEGIN
            SET @IsAvailable = 0;
            SET @Message = 'Guest count exceeds provider maximum of ' + CAST(@MaxEventSize AS NVARCHAR(10));
        END
    END
    
    -- Calculate price based on services/packages
    IF @PackageID IS NOT NULL
    BEGIN
        -- Package pricing
        SELECT @TotalPrice = Price
        FROM ProviderServicePackages
        WHERE PackageID = @PackageID AND ProviderID = @ProviderID AND IsActive = 1;
        
        IF @TotalPrice IS NULL
        BEGIN
            SET @IsAvailable = 0;
            SET @Message = 'Selected package is not available.';
        END
    END
    ELSE IF @ServiceIDs IS NOT NULL
    BEGIN
        -- Individual services pricing
        DECLARE @ServiceTable TABLE (ServiceID INT);
        
        -- Parse JSON array of service IDs
        INSERT INTO @ServiceTable (ServiceID)
        SELECT value FROM OPENJSON(@ServiceIDs);
        
        -- Calculate total price for selected services
        SELECT @TotalPrice = SUM(
            CASE 
                WHEN ps.PriceType = 'hourly' THEN ps.BasePrice * @DurationHours
                WHEN ps.PriceType = 'per person' AND @GuestCount IS NOT NULL THEN ps.BasePrice * @GuestCount
                ELSE ps.BasePrice
            END
        )
        FROM ProviderServices ps
        INNER JOIN @ServiceTable st ON ps.ProviderServiceID = st.ServiceID
        WHERE ps.ProviderID = @ProviderID AND ps.IsActive = 1;
        
        IF @TotalPrice IS NULL
        BEGIN
            SET @IsAvailable = 0;
            SET @Message = 'One or more selected services are not available.';
        END
    END
    ELSE
    BEGIN
        -- Base price only
        SET @TotalPrice = @BasePrice;
    END
    
    -- Apply price multiplier
    SET @TotalPrice = @TotalPrice * @PriceMultiplier;
    
    -- Return results
    SELECT 
        @IsAvailable AS IsAvailable,
        @Message AS Message,
        @BasePrice AS BasePrice,
        @TotalPrice AS TotalPrice,
        @PriceMultiplier AS PriceMultiplier,
        @DurationHours AS DurationHours;
END;
GO

-- sp_Provider_GetReviews: Retrieve provider reviews
CREATE PROCEDURE sp_Provider_GetReviews
    @ProviderID INT,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @MinRating INT = NULL,
    @MaxRating INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    -- Get total count
    DECLARE @TotalCount INT;
    
    SELECT @TotalCount = COUNT(*)
    FROM ProviderReviews
    WHERE ProviderID = @ProviderID
    AND IsApproved = 1
    AND (@MinRating IS NULL OR Rating >= @MinRating)
    AND (@MaxRating IS NULL OR Rating <= @MaxRating);
    
    -- Get paginated reviews
    SELECT 
        pr.ReviewID,
        pr.Rating,
        pr.ReviewText,
        pr.ReviewDate,
        pr.ResponseText,
        pr.ResponseDate,
        u.UserID,
        u.FirstName + ' ' + u.LastName AS ReviewerName,
        u.AvatarURL AS ReviewerAvatar,
        b.EventName,
        b.EventDate,
        @TotalCount AS TotalCount
    FROM 
        ProviderReviews pr
        INNER JOIN Users u ON pr.UserID = u.UserID
        LEFT JOIN Bookings b ON pr.BookingID = b.BookingID
    WHERE 
        pr.ProviderID = @ProviderID
        AND pr.IsApproved = 1
        AND (@MinRating IS NULL OR pr.Rating >= @MinRating)
        AND (@MaxRating IS NULL OR pr.Rating <= @MaxRating)
    ORDER BY 
        pr.ReviewDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Get average rating
    SELECT 
        AVG(CAST(Rating AS DECIMAL(5,2))) AS AverageRating,
        COUNT(*) AS ReviewCount
    FROM 
        ProviderReviews
    WHERE 
        ProviderID = @ProviderID
        AND IsApproved = 1;
    
    -- Get rating distribution
    SELECT 
        Rating,
        COUNT(*) AS Count
    FROM 
        ProviderReviews
    WHERE 
        ProviderID = @ProviderID
        AND IsApproved = 1
    GROUP BY 
        Rating
    ORDER BY 
        Rating DESC;
    
    -- Get detailed category ratings if available
    IF EXISTS (
        SELECT 1 FROM ReviewCategories rc 
        INNER JOIN ServiceProviders sp ON rc.ProviderTypeID = sp.TypeID
        WHERE sp.ProviderID = @ProviderID
    )
    BEGIN
        SELECT 
            rc.CategoryID,
            rc.CategoryName,
            rc.Description,
            AVG(CAST(rcr.Rating AS DECIMAL(5,2))) AS AverageRating,
            COUNT(rcr.RatingID) AS RatingCount
        FROM 
            ReviewCategories rc
            LEFT JOIN ReviewCategoryRatings rcr ON rc.CategoryID = rcr.CategoryID
            LEFT JOIN ProviderReviews pr ON rcr.ReviewID = pr.ReviewID AND pr.ProviderID = @ProviderID
        WHERE 
            rc.ProviderTypeID = (SELECT TypeID FROM ServiceProviders WHERE ProviderID = @ProviderID)
        GROUP BY 
            rc.CategoryID, rc.CategoryName, rc.Description
        ORDER BY 
            rc.CategoryName;
    END
END;
GO



/*
============================================================
12_ Stored Procedures - Booking System.sql
============================================================
*/

-- Section 12: Stored Procedures - Booking System

-- sp_Booking_Create: Create new booking
CREATE OR ALTER PROCEDURE sp_Booking_Create
    @UserID INT,
    @EventTypeID INT,
    @EventName NVARCHAR(255),
    @EventDescription NVARCHAR(MAX) = NULL,
    @EventDate DATE,
    @StartTime TIME,
    @EndTime TIME,
    @GuestCount INT,
    @ProviderDetails NVARCHAR(MAX), -- JSON array of provider IDs and their services/packages
    @PromotionCode NVARCHAR(50) = NULL,
    @SpecialRequests NVARCHAR(MAX) = NULL,
    @BookingID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TotalPrice DECIMAL(18, 2) = 0;
    DECLARE @DepositAmount DECIMAL(18, 2) = 0;
    DECLARE @PromotionDiscount DECIMAL(18, 2) = 0;
    DECLARE @PromotionID INT = NULL;
    DECLARE @IsAvailable BIT = 1;
    DECLARE @ErrorMessage NVARCHAR(255) = '';
    
    -- Validate event date is in the future
    IF @EventDate < CAST(GETDATE() AS DATE)
    BEGIN
        RAISERROR('Event date must be in the future.', 16, 1);
        RETURN;
    END
    
    -- Validate time range
    IF @EndTime <= @StartTime
    BEGIN
        RAISERROR('End time must be after start time.', 16, 1);
        RETURN;
    END
    
    -- Check promotion code if provided
    IF @PromotionCode IS NOT NULL
    BEGIN
        SELECT 
            @PromotionID = PromotionID,
            @PromotionDiscount = CASE 
                WHEN DiscountType = 'Percentage' THEN @TotalPrice * (DiscountValue / 100)
                ELSE DiscountValue
            END
        FROM Promotions
        WHERE 
            PromotionCode = @PromotionCode
            AND IsActive = 1
            AND StartDate <= GETDATE()
            AND EndDate >= GETDATE()
            AND (MaxUses IS NULL OR CurrentUses < MaxUses);
        
        IF @PromotionID IS NULL
        BEGIN
            RAISERROR('Invalid or expired promotion code.', 16, 1);
            RETURN;
        END
    END
    
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Parse provider details JSON
        DECLARE @ProviderTable TABLE (
            ProviderID INT,
            ServiceDetails NVARCHAR(MAX),
            PackageID INT,
            Price DECIMAL(18, 2)
        );
        
        INSERT INTO @ProviderTable (ProviderID, ServiceDetails, PackageID)
        SELECT 
            ProviderID,
            ServiceDetails,
            PackageID
        FROM OPENJSON(@ProviderDetails)
        WITH (
            ProviderID INT '$.ProviderID',
            ServiceDetails NVARCHAR(MAX) '$.ServiceDetails' AS JSON,
            PackageID INT '$.PackageID'
        );
        
        -- Calculate price and check availability for each provider
        DECLARE @CurrentProviderID INT;
        DECLARE @CurrentServiceDetails NVARCHAR(MAX);
        DECLARE @CurrentPackageID INT;
        DECLARE @CurrentPrice DECIMAL(18, 2);
        
        DECLARE provider_cursor CURSOR FOR
        SELECT ProviderID, ServiceDetails, PackageID FROM @ProviderTable;
        
        OPEN provider_cursor;
        FETCH NEXT FROM provider_cursor INTO @CurrentProviderID, @CurrentServiceDetails, @CurrentPackageID;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Check availability and calculate price
            DECLARE @ProviderAvailable BIT;
            DECLARE @ProviderMessage NVARCHAR(255);
            DECLARE @ProviderBasePrice DECIMAL(18, 2);
            DECLARE @ProviderTotalPrice DECIMAL(18, 2);
            DECLARE @ProviderMultiplier DECIMAL(5, 2);
            DECLARE @ProviderDuration DECIMAL(10, 2);
            
            EXEC sp_Provider_CalculatePrice
                @ProviderID = @CurrentProviderID,
                @EventDate = @EventDate,
                @StartTime = @StartTime,
                @EndTime = @EndTime,
                @GuestCount = @GuestCount,
                @ServiceIDs = @CurrentServiceDetails,
                @PackageID = @CurrentPackageID,
                @IsAvailable = @ProviderAvailable OUTPUT,
                @Message = @ProviderMessage OUTPUT,
                @BasePrice = @ProviderBasePrice OUTPUT,
                @TotalPrice = @ProviderTotalPrice OUTPUT,
                @PriceMultiplier = @ProviderMultiplier OUTPUT,
                @DurationHours = @ProviderDuration OUTPUT;
            
            IF @ProviderAvailable = 0
            BEGIN
                SET @IsAvailable = 0;
                SET @ErrorMessage = @ProviderMessage;
                BREAK;
            END
            
            -- Update provider price in temp table
            UPDATE @ProviderTable
            SET Price = @ProviderTotalPrice
            WHERE ProviderID = @CurrentProviderID;
            
            -- Add to total price
            SET @TotalPrice = @TotalPrice + @ProviderTotalPrice;
            
            FETCH NEXT FROM provider_cursor INTO @CurrentProviderID, @CurrentServiceDetails, @CurrentPackageID;
        END
        
        CLOSE provider_cursor;
        DEALLOCATE provider_cursor;
        
        -- If any provider is unavailable, cancel the booking
        IF @IsAvailable = 0
        BEGIN
            RAISERROR(@ErrorMessage, 16, 1);
            RETURN;
        END
        
        -- Apply promotion discount
        IF @PromotionID IS NOT NULL
        BEGIN
            SET @TotalPrice = @TotalPrice - @PromotionDiscount;
            IF @TotalPrice < 0 SET @TotalPrice = 0;
        END
        
        -- Calculate deposit (30% of total price)
        SET @DepositAmount = @TotalPrice * 0.3;
        
        -- Get default "Pending" status
        DECLARE @StatusID INT;
        SELECT @StatusID = StatusID FROM BookingStatuses WHERE StatusName = 'Pending';
        
        IF @StatusID IS NULL
        BEGIN
            SET @StatusID = 1; -- Fallback to first status
        END
        
        -- Create booking record
        INSERT INTO Bookings (
            EventTypeID, UserID, EventName, EventDescription, EventDate, 
            StartTime, EndTime, GuestCount, StatusID, TotalPrice, 
            DepositAmount, DepositPaid, BalanceDueDate
        )
        VALUES (
            @EventTypeID, @UserID, @EventName, @EventDescription, @EventDate, 
            @StartTime, @EndTime, @GuestCount, @StatusID, @TotalPrice, 
            @DepositAmount, 0, DATEADD(DAY, 14, GETDATE()) -- Balance due in 14 days
        );
        
        SET @BookingID = SCOPE_IDENTITY();
        
        -- Add booking providers
        INSERT INTO BookingProviders (
            BookingID, ProviderID, ProviderTypeID, ServiceDetails, SpecialRequests, 
            StatusID, Price, DepositAmount, DepositPaid, BalanceDueDate
        )
        SELECT 
            @BookingID,
            pt.ProviderID,
            sp.TypeID,
            pt.ServiceDetails,
            @SpecialRequests,
            @StatusID,
            pt.Price,
            pt.Price * 0.3, -- 30% deposit for each provider
            0,
            DATEADD(DAY, 14, GETDATE()) -- Balance due in 14 days
        FROM 
            @ProviderTable pt
            INNER JOIN ServiceProviders sp ON pt.ProviderID = sp.ProviderID;
        
        -- Add booking timeline events
        INSERT INTO BookingTimeline (
            BookingID, EventDate, EventType, Title, Description
        )
        VALUES 
            (@BookingID, GETDATE(), 'Booking', 'Booking Created', 'Booking was created and is pending payment.'),
            (@BookingID, DATEADD(DAY, 1, GETDATE()), 'Reminder', 'Deposit Reminder', 'Reminder to pay deposit.'),
            (@BookingID, DATEADD(DAY, 7, GETDATE()), 'Reminder', 'Deposit Due', 'Deposit payment is due.'),
            (@BookingID, DATEADD(DAY, 14, GETDATE()), 'Payment', 'Balance Due', 'Full balance payment is due.'),
            (@BookingID, DATEADD(DAY, -7, @EventDate), 'Reminder', 'Upcoming Event', 'Event is coming up in 7 days.'),
            (@BookingID, DATEADD(DAY, -1, @EventDate), 'Reminder', 'Event Tomorrow', 'Event is happening tomorrow.'),
            (@BookingID, @EventDate, 'Event', 'Event Day', 'Event is happening today.');
        
        -- Record promotion redemption if applicable
        IF @PromotionID IS NOT NULL
        BEGIN
            INSERT INTO PromotionRedemptions (
                PromotionID, BookingID, UserID, DiscountAmount
            )
            VALUES (
                @PromotionID, @BookingID, @UserID, @PromotionDiscount
            );
            
            -- Increment promotion uses
            UPDATE Promotions
            SET CurrentUses = CurrentUses + 1
            WHERE PromotionID = @PromotionID;
        END
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- sp_Booking_UpdateStatus: Change booking status
CREATE OR ALTER PROCEDURE sp_Booking_UpdateStatus
    @BookingID INT,
    @StatusName NVARCHAR(50),
    @Notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StatusID INT;
    DECLARE @OldStatus NVARCHAR(50);
    DECLARE @UserID INT;
    DECLARE @EventDate DATE;
    
    -- Get new status ID
    SELECT @StatusID = StatusID 
    FROM BookingStatuses 
    WHERE StatusName = @StatusName;
    
    IF @StatusID IS NULL
    BEGIN
        RAISERROR('Invalid status name.', 16, 1);
        RETURN;
    END
    
    -- Get current status and user ID
    SELECT 
        @OldStatus = bs.StatusName,
        @UserID = b.UserID,
        @EventDate = b.EventDate
    FROM 
        Bookings b
        INNER JOIN BookingStatuses bs ON b.StatusID = bs.StatusID
    WHERE 
        b.BookingID = @BookingID;
    
    IF @UserID IS NULL
    BEGIN
        RAISERROR('Booking not found.', 16, 1);
        RETURN;
    END
    
    -- Update booking status
    UPDATE Bookings
    SET 
        StatusID = @StatusID,
        LastUpdated = GETDATE()
    WHERE 
        BookingID = @BookingID;
    
    -- Update all booking providers to same status
    UPDATE BookingProviders
    SET 
        StatusID = @StatusID,
        ModifiedDate = GETDATE()
    WHERE 
        BookingID = @BookingID;
    
    -- Add timeline event for status change
    INSERT INTO BookingTimeline (
        BookingID, EventDate, EventType, Title, Description
    )
    VALUES (
        @BookingID, GETDATE(), 'StatusChange', 
        'Status Changed', 
        'Booking status changed from ' + @OldStatus + ' to ' + @StatusName + 
        CASE WHEN @Notes IS NOT NULL THEN '. Notes: ' + @Notes ELSE '' END
    );
    
    -- If booking is confirmed, send deposit reminders
    IF @StatusName = 'Confirmed'
    BEGIN
        -- Add deposit due timeline events
        INSERT INTO BookingTimeline (
            BookingID, EventDate, EventType, Title, Description
        )
        VALUES 
            (@BookingID, DATEADD(DAY, 1, GETDATE()), 'Reminder', 'Deposit Reminder', 'Reminder to pay deposit.'),
            (@BookingID, DATEADD(DAY, 7, GETDATE()), 'Reminder', 'Deposit Due', 'Deposit payment is due.');
    END
    
    -- If booking is completed, create review reminders
    IF @StatusName = 'Completed'
    BEGIN
        -- Add review reminder timeline events
        INSERT INTO BookingTimeline (
            BookingID, EventDate, EventType, Title, Description
        )
        VALUES 
            (@BookingID, DATEADD(DAY, 1, GETDATE()), 'Reminder', 'Leave a Review', 'Please leave a review for your providers.'),
            (@BookingID, DATEADD(DAY, 7, GETDATE()), 'Reminder', 'Review Reminder', 'Reminder to leave a review for your providers.');
    END
END;
GO

-- sp_Booking_GetByUser: List user's bookings
CREATE OR ALTER PROCEDURE sp_Booking_GetByUser
    @UserID INT,
    @StatusFilter NVARCHAR(50) = NULL,
    @UpcomingOnly BIT = 0,
    @PageNumber INT = 1,
    @PageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    -- Get total count
    DECLARE @TotalCount INT;
    SELECT @TotalCount = COUNT(*)
    FROM Bookings b
    WHERE b.UserID = @UserID
    AND (@StatusFilter IS NULL OR EXISTS (
        SELECT 1 FROM BookingStatuses bs 
        WHERE bs.StatusID = b.StatusID AND bs.StatusName = @StatusFilter
    ))
    AND (@UpcomingOnly = 0 OR b.EventDate >= GETDATE());
    
    -- Get paginated bookings
    SELECT 
        b.BookingID,
        b.EventName,
        b.EventDate,
        b.StartTime,
        b.EndTime,
        b.GuestCount,
        b.TotalPrice,
        b.DepositAmount,
        b.DepositPaid,
        b.BalanceDueDate,
        bs.StatusName AS BookingStatus,
        et.TypeName AS EventType,
        DATEDIFF(DAY, GETDATE(), b.EventDate) AS DaysUntilEvent,
        (SELECT COUNT(*) FROM BookingProviders bp WHERE bp.BookingID = b.BookingID) AS ProviderCount,
        (SELECT STRING_AGG(sp.BusinessName, ', ') 
         FROM BookingProviders bp 
         INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
         WHERE bp.BookingID = b.BookingID) AS ProviderNames,
        @TotalCount AS TotalCount
    FROM 
        Bookings b
        INNER JOIN BookingStatuses bs ON b.StatusID = bs.StatusID
        INNER JOIN EventTypes et ON b.EventTypeID = et.EventTypeID
    WHERE 
        b.UserID = @UserID
        AND (@StatusFilter IS NULL OR bs.StatusName = @StatusFilter)
        AND (@UpcomingOnly = 0 OR b.EventDate >= GETDATE())
    ORDER BY 
        b.EventDate
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- sp_Booking_CheckAvailability: Verify date availability
CREATE OR ALTER PROCEDURE sp_Booking_CheckAvailability
    @ProviderIDs NVARCHAR(MAX), -- JSON array of provider IDs
    @EventDate DATE,
    @StartTime TIME,
    @EndTime TIME,
    @GuestCount INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Parse provider IDs from JSON
    DECLARE @ProviderTable TABLE (ProviderID INT);
    INSERT INTO @ProviderTable (ProviderID)
    SELECT value FROM OPENJSON(@ProviderIDs);
    
    -- Check availability for each provider
    SELECT 
        sp.ProviderID,
        sp.BusinessName,
        pt.TypeName AS ProviderType,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM ProviderBlackoutDates bd 
                WHERE bd.ProviderID = sp.ProviderID 
                AND @EventDate BETWEEN bd.StartDate AND bd.EndDate
            ) THEN 0
            WHEN EXISTS (
                SELECT 1 FROM Bookings b 
                INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
                WHERE bp.ProviderID = sp.ProviderID 
                AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
                AND b.EventDate = @EventDate
                AND (
                    (@StartTime >= b.StartTime AND @StartTime < b.EndTime) OR
                    (@EndTime > b.StartTime AND @EndTime <= b.EndTime) OR
                    (@StartTime <= b.StartTime AND @EndTime >= b.EndTime)
                )
            ) THEN 0
            WHEN EXISTS (
                SELECT 1 FROM ProviderAvailability pa 
                WHERE pa.ProviderID = sp.ProviderID 
                AND pa.DayOfWeek = DATEPART(WEEKDAY, @EventDate)
                AND pa.IsAvailable = 1
                AND @StartTime >= pa.StartTime 
                AND @EndTime <= pa.EndTime
            ) THEN 1
            ELSE 0
        END AS IsAvailable,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM ProviderBlackoutDates bd 
                WHERE bd.ProviderID = sp.ProviderID 
                AND @EventDate BETWEEN bd.StartDate AND bd.EndDate
            ) THEN 'Provider is not available on this date (blackout).'
            WHEN EXISTS (
                SELECT 1 FROM Bookings b 
                INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
                WHERE bp.ProviderID = sp.ProviderID 
                AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
                AND b.EventDate = @EventDate
                AND (
                    (@StartTime >= b.StartTime AND @StartTime < b.EndTime) OR
                    (@EndTime > b.StartTime AND @EndTime <= b.EndTime) OR
                    (@StartTime <= b.StartTime AND @EndTime >= b.EndTime)
                )
            ) THEN 'Provider is already booked at the requested time.'
            WHEN NOT EXISTS (
                SELECT 1 FROM ProviderAvailability pa 
                WHERE pa.ProviderID = sp.ProviderID 
                AND pa.DayOfWeek = DATEPART(WEEKDAY, @EventDate)
                AND pa.IsAvailable = 1
                AND @StartTime >= pa.StartTime 
                AND @EndTime <= pa.EndTime
            ) THEN 'Provider is not available at the requested time.'
            WHEN @GuestCount IS NOT NULL AND sp.MinEventSize IS NOT NULL AND @GuestCount < sp.MinEventSize THEN 
                'Guest count is below provider minimum of ' + CAST(sp.MinEventSize AS NVARCHAR(10))
            WHEN @GuestCount IS NOT NULL AND sp.MaxEventSize IS NOT NULL AND @GuestCount > sp.MaxEventSize THEN 
                'Guest count exceeds provider maximum of ' + CAST(sp.MaxEventSize AS NVARCHAR(10))
            ELSE 'Available'
        END AS AvailabilityMessage
    FROM 
        ServiceProviders sp
        INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
        INNER JOIN @ProviderTable ptbl ON sp.ProviderID = ptbl.ProviderID
    WHERE 
        sp.IsActive = 1;
END;
GO

-- sp_Booking_Cancel: Handle cancellations
CREATE OR ALTER PROCEDURE sp_Booking_Cancel
    @BookingID INT,
    @CancellationReason NVARCHAR(MAX) = NULL,
    @RefundAmount DECIMAL(18, 2) = NULL,
    @ProcessRefund BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserID INT;
    DECLARE @CurrentStatus NVARCHAR(50);
    DECLARE @TotalPaid DECIMAL(18, 2) = 0;
    DECLARE @CancellationFee DECIMAL(18, 2) = 0;
    
    -- Get booking details
    SELECT 
        @UserID = b.UserID,
        @CurrentStatus = bs.StatusName,
        @TotalPaid = ISNULL((SELECT SUM(Amount) FROM Payments p WHERE p.BookingID = b.BookingID AND p.Status = 'Completed'), 0)
    FROM 
        Bookings b
        INNER JOIN BookingStatuses bs ON b.StatusID = bs.StatusID
    WHERE 
        b.BookingID = @BookingID;
    
    IF @UserID IS NULL
    BEGIN
        RAISERROR('Booking not found.', 16, 1);
        RETURN;
    END
    
    -- Check if booking is already cancelled
    IF @CurrentStatus = 'Cancelled'
    BEGIN
        RAISERROR('Booking is already cancelled.', 16, 1);
        RETURN;
    END
    
    -- Calculate cancellation fee if not specified
    IF @RefundAmount IS NULL
    BEGIN
        -- Default policy: 
        -- - Full refund if cancelled more than 30 days before event
        -- - 50% refund if cancelled 7-30 days before event
        -- - No refund if cancelled less than 7 days before event
        DECLARE @EventDate DATE;
        DECLARE @DaysUntilEvent INT;
        
        SELECT @EventDate = EventDate FROM Bookings WHERE BookingID = @BookingID;
        SET @DaysUntilEvent = DATEDIFF(DAY, GETDATE(), @EventDate);
        
        IF @DaysUntilEvent > 30
        BEGIN
            SET @RefundAmount = @TotalPaid;
            SET @CancellationFee = 0;
        END
        ELSE IF @DaysUntilEvent > 7
        BEGIN
            SET @RefundAmount = @TotalPaid * 0.5;
            SET @CancellationFee = @TotalPaid * 0.5;
        END
        ELSE
        BEGIN
            SET @RefundAmount = 0;
            SET @CancellationFee = @TotalPaid;
        END
    END
    ELSE
    BEGIN
        SET @CancellationFee = @TotalPaid - @RefundAmount;
    END
    
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Update booking status to Cancelled
        DECLARE @CancelledStatusID INT;
        SELECT @CancelledStatusID = StatusID FROM BookingStatuses WHERE StatusName = 'Cancelled';
        
        UPDATE Bookings
        SET 
            StatusID = @CancelledStatusID,
            LastUpdated = GETDATE()
        WHERE 
            BookingID = @BookingID;
        
        -- Update all booking providers to Cancelled status
        UPDATE BookingProviders
        SET 
            StatusID = @CancelledStatusID,
            ModifiedDate = GETDATE()
        WHERE 
            BookingID = @BookingID;
        
        -- Add timeline event for cancellation
        INSERT INTO BookingTimeline (
            BookingID, EventDate, EventType, Title, Description
        )
        VALUES (
            @BookingID, GETDATE(), 'Cancellation', 
            'Booking Cancelled', 
            'Booking was cancelled. ' + 
            CASE WHEN @CancellationReason IS NOT NULL THEN 'Reason: ' + @CancellationReason ELSE '' END + 
            CASE WHEN @RefundAmount > 0 THEN ' Refund amount: ' + FORMAT(@RefundAmount, 'C') ELSE '' END
        );
        
        -- Process refund if requested and applicable
        IF @ProcessRefund = 1 AND @RefundAmount > 0
        BEGIN
            -- Record refund payment
            INSERT INTO Payments (
                BookingID, UserID, Amount, PaymentDate, MethodID, 
                Status, FeeAmount, NetAmount, Notes
            )
            SELECT 
                @BookingID,
                @UserID,
                -@RefundAmount, -- Negative amount for refund
                GETDATE(),
                p.MethodID,
                'Completed',
                0, -- No fee for refunds
                -@RefundAmount,
                'Refund for cancelled booking #' + CAST(@BookingID AS NVARCHAR(10))
            FROM Payments p
            WHERE p.BookingID = @BookingID
            AND p.Status = 'Completed'
            ORDER BY p.PaymentDate DESC
            OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY;
            
            -- Update booking to mark deposit as refunded
            UPDATE Bookings
            SET DepositPaid = 0
            WHERE BookingID = @BookingID;
            
            -- Add timeline event for refund
            INSERT INTO BookingTimeline (
                BookingID, EventDate, EventType, Title, Description
            )
            VALUES (
                @BookingID, GETDATE(), 'Refund', 
                'Refund Processed', 
                'Refund of ' + FORMAT(@RefundAmount, 'C') + ' was processed for cancelled booking.'
            );
        END
        
        -- Record cancellation fee
        IF @CancellationFee > 0
        BEGIN
            -- Add timeline event for cancellation fee
            INSERT INTO BookingTimeline (
                BookingID, EventDate, EventType, Title, Description
            )
            VALUES (
                @BookingID, GETDATE(), 'Fee', 
                'Cancellation Fee Applied', 
                'Cancellation fee of ' + FORMAT(@CancellationFee, 'C') + ' was applied.'
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

-- sp_Booking_AddMultipleProviders: Handle multi-service bookings
CREATE OR ALTER PROCEDURE sp_Booking_AddMultipleProviders
    @BookingID INT,
    @ProviderDetails NVARCHAR(MAX), -- JSON array of provider IDs and their services/packages
    @SpecialRequests NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @EventDate DATE;
    DECLARE @StartTime TIME;
    DECLARE @EndTime TIME;
    DECLARE @GuestCount INT;
    DECLARE @IsAvailable BIT = 1;
    DECLARE @ErrorMessage NVARCHAR(255) = '';
    
    -- Get booking details
    SELECT 
        @EventDate = EventDate,
        @StartTime = StartTime,
        @EndTime = EndTime,
        @GuestCount = GuestCount
    FROM Bookings
    WHERE BookingID = @BookingID;
    
    IF @EventDate IS NULL
    BEGIN
        RAISERROR('Booking not found.', 16, 1);
        RETURN;
    END
    
    -- Parse provider details JSON
    DECLARE @ProviderTable TABLE (
        ProviderID INT,
        ServiceDetails NVARCHAR(MAX),
        PackageID INT,
        Price DECIMAL(18, 2)
    );
    
    INSERT INTO @ProviderTable (ProviderID, ServiceDetails, PackageID)
    SELECT 
        ProviderID,
        ServiceDetails,
        PackageID
    FROM OPENJSON(@ProviderDetails)
    WITH (
        ProviderID INT '$.ProviderID',
        ServiceDetails NVARCHAR(MAX) '$.ServiceDetails' AS JSON,
        PackageID INT '$.PackageID'
    );
    
    -- Check availability and calculate price for each new provider
    DECLARE @CurrentProviderID INT;
    DECLARE @CurrentServiceDetails NVARCHAR(MAX);
    DECLARE @CurrentPackageID INT;
    DECLARE @CurrentPrice DECIMAL(18, 2);
    
    DECLARE provider_cursor CURSOR FOR
    SELECT ProviderID, ServiceDetails, PackageID FROM @ProviderTable;
    
    OPEN provider_cursor;
    FETCH NEXT FROM provider_cursor INTO @CurrentProviderID, @CurrentServiceDetails, @CurrentPackageID;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Check if provider is already part of this booking
        IF EXISTS (SELECT 1 FROM BookingProviders WHERE BookingID = @BookingID AND ProviderID = @CurrentProviderID)
        BEGIN
            SET @IsAvailable = 0;
            SET @ErrorMessage = 'Provider is already part of this booking.';
            BREAK;
        END
        
        -- Check availability and calculate price
        DECLARE @ProviderAvailable BIT;
        DECLARE @ProviderMessage NVARCHAR(255);
        DECLARE @ProviderBasePrice DECIMAL(18, 2);
        DECLARE @ProviderTotalPrice DECIMAL(18, 2);
        DECLARE @ProviderMultiplier DECIMAL(5, 2);
        DECLARE @ProviderDuration DECIMAL(10, 2);
        
        EXEC sp_Provider_CalculatePrice
            @ProviderID = @CurrentProviderID,
            @EventDate = @EventDate,
            @StartTime = @StartTime,
            @EndTime = @EndTime,
            @GuestCount = @GuestCount,
            @ServiceIDs = @CurrentServiceDetails,
            @PackageID = @CurrentPackageID,
            @IsAvailable = @ProviderAvailable OUTPUT,
            @Message = @ProviderMessage OUTPUT,
            @BasePrice = @ProviderBasePrice OUTPUT,
            @TotalPrice = @ProviderTotalPrice OUTPUT,
            @PriceMultiplier = @ProviderMultiplier OUTPUT,
            @DurationHours = @ProviderDuration OUTPUT;
        
        IF @ProviderAvailable = 0
        BEGIN
            SET @IsAvailable = 0;
            SET @ErrorMessage = @ProviderMessage;
            BREAK;
        END
        
        -- Update provider price in temp table
        UPDATE @ProviderTable
        SET Price = @ProviderTotalPrice
        WHERE ProviderID = @CurrentProviderID;
        
        FETCH NEXT FROM provider_cursor INTO @CurrentProviderID, @CurrentServiceDetails, @CurrentPackageID;
    END
    
    CLOSE provider_cursor;
    DEALLOCATE provider_cursor;
    
    -- If any provider is unavailable, cancel the operation
    IF @IsAvailable = 0
    BEGIN
        RAISERROR(@ErrorMessage, 16, 1);
        RETURN;
    END
    
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Get booking status
        DECLARE @StatusID INT;
        SELECT @StatusID = StatusID 
        FROM Bookings 
        WHERE BookingID = @BookingID;
        
        -- Add new booking providers
        INSERT INTO BookingProviders (
            BookingID, ProviderID, ProviderTypeID, ServiceDetails, SpecialRequests, 
            StatusID, Price, DepositAmount, DepositPaid, BalanceDueDate
        )
        SELECT 
            @BookingID,
            pt.ProviderID,
            sp.TypeID,
            pt.ServiceDetails,
            @SpecialRequests,
            @StatusID,
            pt.Price,
            pt.Price * 0.3, -- 30% deposit for each provider
            0,
            DATEADD(DAY, 14, GETDATE()) -- Balance due in 14 days
        FROM 
            @ProviderTable pt
            INNER JOIN ServiceProviders sp ON pt.ProviderID = sp.ProviderID;
        
        -- Update booking total price
        DECLARE @AdditionalCost DECIMAL(18, 2);
        SELECT @AdditionalCost = SUM(Price) 
        FROM @ProviderTable;
        
        UPDATE Bookings
        SET 
            TotalPrice = TotalPrice + @AdditionalCost,
            DepositAmount = DepositAmount + (@AdditionalCost * 0.3),
            LastUpdated = GETDATE()
        WHERE 
            BookingID = @BookingID;
        
        -- Add timeline event for added providers
        INSERT INTO BookingTimeline (
            BookingID, EventDate, EventType, Title, Description
        )
        VALUES (
            @BookingID, GETDATE(), 'Update', 
            'Additional Providers Added', 
            'Added ' + CAST((SELECT COUNT(*) FROM @ProviderTable) AS NVARCHAR(10)) + 
            ' providers to the booking. Additional cost: ' + FORMAT(@AdditionalCost, 'C')
        );
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO



/*
============================================================
13_ Stored Procedures - Financial.sql
============================================================
*/

-- Section 13: Stored Procedures - Financial

-- sp_Payment_Process: Handle payment transactions
CREATE PROCEDURE sp_Payment_Process
    @BookingID INT,
    @UserID INT,
    @Amount DECIMAL(18, 2),
    @MethodID INT,
    @TransactionID NVARCHAR(255) = NULL,
    @Status NVARCHAR(20) = 'Pending',
    @Notes NVARCHAR(MAX) = NULL,
    @PaymentID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @BookingStatus NVARCHAR(50);
    DECLARE @TotalPrice DECIMAL(18, 2);
    DECLARE @TotalPaid DECIMAL(18, 2);
    DECLARE @DepositAmount DECIMAL(18, 2);
    DECLARE @DepositPaid BIT;
    DECLARE @BalanceDueDate DATE;
    DECLARE @FeeAmount DECIMAL(18, 2) = 0;
    DECLARE @NetAmount DECIMAL(18, 2) = @Amount;

    -- Get booking details if provided
    IF @BookingID IS NOT NULL
    BEGIN
        SELECT 
            @BookingStatus = bs.StatusName,
            @TotalPrice = b.TotalPrice,
            @DepositAmount = b.DepositAmount,
            @DepositPaid = b.DepositPaid,
            @BalanceDueDate = b.BalanceDueDate
        FROM 
            Bookings b
            INNER JOIN BookingStatuses bs ON b.StatusID = bs.StatusID
        WHERE 
            b.BookingID = @BookingID;

        IF @BookingStatus IS NULL
        BEGIN
            RAISERROR('Booking not found.', 16, 1);
            RETURN;
        END
        
        -- Calculate total paid so far
        SELECT @TotalPaid = ISNULL(SUM(Amount), 0)
        FROM Payments
        WHERE BookingID = @BookingID AND Status = 'Completed';

        -- Check if payment exceeds remaining balance
        IF @Amount > (@TotalPrice - @TotalPaid)
        BEGIN
            RAISERROR('Payment amount exceeds remaining balance.', 16, 1);
            RETURN;
        END
        
        -- Calculate processing fee if method has one
        SELECT @FeeAmount = @Amount * (ProcessingFeePercent / 100)
        FROM PaymentMethods
        WHERE MethodID = @MethodID;

        SET @NetAmount = @Amount - @FeeAmount;
    END
    
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Insert payment record
        INSERT INTO Payments (
            BookingID, UserID, ProviderID, Amount, PaymentDate, 
            MethodID, TransactionID, Status, FeeAmount, NetAmount, Notes
        )
        SELECT 
            @BookingID,
            @UserID,
            NULL, -- ProviderID will be set for payouts
            @Amount,
            GETDATE(),
            @MethodID,
            @TransactionID,
            @Status,
            @FeeAmount,
            @NetAmount,
            @Notes;

        SET @PaymentID = SCOPE_IDENTITY();

        -- If payment is for a booking and status is Completed, update booking
        IF @BookingID IS NOT NULL AND @Status = 'Completed'
        BEGIN
            -- Update total paid amount
            SET @TotalPaid = @TotalPaid + @Amount;

            -- Check if deposit is now paid
            DECLARE @NewDepositPaid BIT = @DepositPaid;
            IF @DepositPaid = 0 AND @TotalPaid >= @DepositAmount
            BEGIN
                SET @NewDepositPaid = 1;

                -- Add timeline event for deposit paid
                INSERT INTO BookingTimeline (
                    BookingID, EventDate, EventType, Title, Description
                )
                VALUES (
                    @BookingID, GETDATE(), 'Payment', 
                    'Deposit Paid', 
                    'Deposit of ' + FORMAT(@DepositAmount, 'C') + ' has been paid.'
                );
            END
            
            -- Check if booking is now fully paid
            DECLARE @NewStatusID INT;
            IF @TotalPaid >= @TotalPrice
            BEGIN
                -- Booking is fully paid
                SELECT @NewStatusID = StatusID FROM BookingStatuses WHERE StatusName = 'Confirmed';

                -- Add timeline event for full payment
                INSERT INTO BookingTimeline (
                    BookingID, EventDate, EventType, Title, Description
                )
                VALUES (
                    @BookingID, GETDATE(), 'Payment', 
                    'Fully Paid', 
                    'Booking has been fully paid. Thank you!'
                );
            END
            ELSE
            BEGIN
                -- Booking is partially paid
                SELECT @NewStatusID = StatusID FROM BookingStatuses WHERE StatusName = 
                    CASE WHEN @BookingStatus = 'Pending' AND @NewDepositPaid = 1 THEN 'Confirmed' ELSE @BookingStatus END;
            END
            
            -- Update booking
            UPDATE Bookings
            SET 
                StatusID = @NewStatusID,
                DepositPaid = @NewDepositPaid,
                LastUpdated = GETDATE()
            WHERE 
                BookingID = @BookingID;

            -- Update booking providers if deposit is now paid
            IF @NewDepositPaid = 1 AND @DepositPaid = 0
            BEGIN
                UPDATE BookingProviders
                SET 
                    DepositPaid = 1,
                    ModifiedDate = GETDATE()
                WHERE 
                    BookingID = @BookingID;
            END
        END
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;
GO

-- sp_Invoice_Generate: Create invoices
CREATE PROCEDURE sp_Invoice_Generate
    @BookingID INT,
    @InvoiceNumber NVARCHAR(50) = NULL,
    @IssueDate DATE = NULL,
    @DueDate DATE = NULL,
    @InvoiceID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserID INT;
    DECLARE @EventDate DATE;
    DECLARE @TotalPrice DECIMAL(18, 2);
    DECLARE @TotalPaid DECIMAL(18, 2);
    DECLARE @TaxAmount DECIMAL(18, 2) = 0;

    -- Get booking details
    SELECT 
        @UserID = b.UserID,
        @EventDate = b.EventDate,
        @TotalPrice = b.TotalPrice,
        @TotalPaid = ISNULL((SELECT SUM(Amount) FROM Payments p WHERE p.BookingID = b.BookingID AND p.Status = 'Completed'), 0)
    FROM 
        Bookings b
    WHERE 
        b.BookingID = @BookingID;

    IF @UserID IS NULL
    BEGIN
        RAISERROR('Booking not found.', 16, 1);
        RETURN;
    END
    
    -- Calculate tax (simplified for example)
    -- In a real system, you would look up tax rates based on location
    SET @TaxAmount = @TotalPrice * 0.1; -- 10% tax
    
    -- Set default dates if not provided
    IF @IssueDate IS NULL SET @IssueDate = GETDATE();
    IF @DueDate IS NULL SET @DueDate = DATEADD(DAY, 14, @IssueDate);

    -- Generate invoice number if not provided (YYYYMMDD-XXXXX)
    IF @InvoiceNumber IS NULL
    BEGIN
        DECLARE @NextNum INT;
        SELECT @NextNum = ISNULL(MAX(CAST(SUBSTRING(InvoiceNumber, 10, 5) AS INT)), 0) + 1
        FROM Invoices
        WHERE InvoiceNumber LIKE FORMAT(GETDATE(), 'yyyyMMdd') + '-%';
        
        SET @InvoiceNumber = FORMAT(GETDATE(), 'yyyyMMdd') + '-' + RIGHT('00000' + CAST(@NextNum AS NVARCHAR(5)), 5);
    END
    
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Insert invoice record
        INSERT INTO Invoices (
            BookingID, InvoiceNumber, IssueDate, DueDate, Status,
            Subtotal, TaxAmount, TotalAmount, AmountPaid, BalanceDue
        )
        VALUES (
            @BookingID, @InvoiceNumber, @IssueDate, @DueDate, 
            CASE WHEN @TotalPaid >= @TotalPrice THEN 'Paid' ELSE 'Pending' END,
            @TotalPrice - @TaxAmount, @TaxAmount, @TotalPrice, @TotalPaid, @TotalPrice - @TotalPaid
        );

        SET @InvoiceID = SCOPE_IDENTITY();

        -- Add timeline event for invoice generation
        INSERT INTO BookingTimeline (
            BookingID, EventDate, EventType, Title, Description
        )
        VALUES (
            @BookingID, GETDATE(), 'Invoice', 
            'Invoice Generated', 
            'Invoice #' + @InvoiceNumber + ' has been generated. Amount due: ' + FORMAT(@TotalPrice - @TotalPaid, 'C')
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;
GO

-- sp_Revenue_Report: Generate financial reports
CREATE PROCEDURE sp_Revenue_Report
    @StartDate DATE = NULL,
    @EndDate DATE = NULL,
    @ProviderID INT = NULL,
    @ProviderTypeID INT = NULL,
    @EventTypeID INT = NULL,
    @GroupBy NVARCHAR(20) = 'month' -- day, week, month, quarter, year
AS
BEGIN
    SET NOCOUNT ON;

    -- Set default date range if not provided
    IF @StartDate IS NULL SET @StartDate = DATEADD(YEAR, -1, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();

    -- Validate date range
    IF @EndDate < @StartDate
    BEGIN
        RAISERROR('End date must be after start date.', 16, 1);
        RETURN;
    END
    
    -- Generate report based on grouping
    IF @GroupBy = 'day'
    BEGIN
        SELECT 
            CAST(b.EventDate AS DATE) AS Period,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(b.TotalPrice) AS GrossRevenue,
            SUM(p.FeeAmount) AS FeesCollected,
            SUM(p.NetAmount) AS NetRevenue,
            SUM(CASE WHEN p.Amount < 0 THEN -p.Amount ELSE 0 END) AS Refunds
        FROM 
            Bookings b
            INNER JOIN Payments p ON b.BookingID = p.BookingID
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
        WHERE 
            b.EventDate BETWEEN @StartDate AND @EndDate
            AND (@ProviderID IS NULL OR bp.ProviderID = @ProviderID)
            AND (@ProviderTypeID IS NULL OR sp.TypeID = @ProviderTypeID)
            AND (@EventTypeID IS NULL OR b.EventTypeID = @EventTypeID)
            AND p.Status = 'Completed'
        GROUP BY 
            CAST(b.EventDate AS DATE)
        ORDER BY 
            CAST(b.EventDate AS DATE);
    END
    ELSE IF @GroupBy = 'week'
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            DATEPART(WEEK, b.EventDate) AS Week,
            MIN(b.EventDate) AS WeekStartDate,
            MAX(b.EventDate) AS WeekEndDate,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(b.TotalPrice) AS GrossRevenue,
            SUM(p.FeeAmount) AS FeesCollected,
            SUM(p.NetAmount) AS NetRevenue,
            SUM(CASE WHEN p.Amount < 0 THEN -p.Amount ELSE 0 END) AS Refunds
        FROM 
            Bookings b
            INNER JOIN Payments p ON b.BookingID = p.BookingID
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
        WHERE 
            b.EventDate BETWEEN @StartDate AND @EndDate
            AND (@ProviderID IS NULL OR bp.ProviderID = @ProviderID)
            AND (@ProviderTypeID IS NULL OR sp.TypeID = @ProviderTypeID)
            AND (@EventTypeID IS NULL OR b.EventTypeID = @EventTypeID)
            AND p.Status = 'Completed'
        GROUP BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(WEEK, b.EventDate)
        ORDER BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(WEEK, b.EventDate);
    END
    ELSE IF @GroupBy = 'month'
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            DATEPART(MONTH, b.EventDate) AS Month,
            FORMAT(b.EventDate, 'yyyy-MM') AS Period,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(b.TotalPrice) AS GrossRevenue,
            SUM(p.FeeAmount) AS FeesCollected,
            SUM(p.NetAmount) AS NetRevenue,
            SUM(CASE WHEN p.Amount < 0 THEN -p.Amount ELSE 0 END) AS Refunds
        FROM 
            Bookings b
            INNER JOIN Payments p ON b.BookingID = p.BookingID
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
        WHERE 
            b.EventDate BETWEEN @StartDate AND @EndDate
            AND (@ProviderID IS NULL OR bp.ProviderID = @ProviderID)
            AND (@ProviderTypeID IS NULL OR sp.TypeID = @ProviderTypeID)
            AND (@EventTypeID IS NULL OR b.EventTypeID = @EventTypeID)
            AND p.Status = 'Completed'
        GROUP BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(MONTH, b.EventDate),
            FORMAT(b.EventDate, 'yyyy-MM')
        ORDER BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(MONTH, b.EventDate);
    END
    ELSE IF @GroupBy = 'quarter'
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            DATEPART(QUARTER, b.EventDate) AS Quarter,
            'Q' + CAST(DATEPART(QUARTER, b.EventDate) AS VARCHAR(1)) + ' ' + CAST(DATEPART(YEAR, b.EventDate) AS VARCHAR(4)) AS Period,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(b.TotalPrice) AS GrossRevenue,
            SUM(p.FeeAmount) AS FeesCollected,
            SUM(p.NetAmount) AS NetRevenue,
            SUM(CASE WHEN p.Amount < 0 THEN -p.Amount ELSE 0 END) AS Refunds
        FROM 
            Bookings b
            INNER JOIN Payments p ON b.BookingID = p.BookingID
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
        WHERE 
            b.EventDate BETWEEN @StartDate AND @EndDate
            AND (@ProviderID IS NULL OR bp.ProviderID = @ProviderID)
            AND (@ProviderTypeID IS NULL OR sp.TypeID = @ProviderTypeID)
            AND (@EventTypeID IS NULL OR b.EventTypeID = @EventTypeID)
            AND p.Status = 'Completed'
        GROUP BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(QUARTER, b.EventDate),
            'Q' + CAST(DATEPART(QUARTER, b.EventDate) AS VARCHAR(1)) + ' ' + CAST(DATEPART(YEAR, b.EventDate) AS VARCHAR(4))
        ORDER BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(QUARTER, b.EventDate);
    END
    ELSE -- year
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(b.TotalPrice) AS GrossRevenue,
            SUM(p.FeeAmount) AS FeesCollected,
            SUM(p.NetAmount) AS NetRevenue,
            SUM(CASE WHEN p.Amount < 0 THEN -p.Amount ELSE 0 END) AS Refunds
        FROM 
            Bookings b
            INNER JOIN Payments p ON b.BookingID = p.BookingID
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
        WHERE 
            b.EventDate BETWEEN @StartDate AND @EndDate
            AND (@ProviderID IS NULL OR bp.ProviderID = @ProviderID)
            AND (@ProviderTypeID IS NULL OR sp.TypeID = @ProviderTypeID)
            AND (@EventTypeID IS NULL OR b.EventTypeID = @EventTypeID)
            AND p.Status = 'Completed'
        GROUP BY 
            DATEPART(YEAR, b.EventDate)
        ORDER BY 
            DATEPART(YEAR, b.EventDate);
    END
    
    -- Get summary totals
    SELECT 
        COUNT(DISTINCT b.BookingID) AS TotalBookingCount,
        SUM(b.TotalPrice) AS TotalGrossRevenue,
        SUM(p.FeeAmount) AS TotalFeesCollected,
        SUM(p.NetAmount) AS TotalNetRevenue,
        SUM(CASE WHEN p.Amount < 0 THEN -p.Amount ELSE 0 END) AS TotalRefunds
    FROM 
        Bookings b
        INNER JOIN Payments p ON b.BookingID = p.BookingID
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
        INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
    WHERE 
        b.EventDate BETWEEN @StartDate AND @EndDate
        AND (@ProviderID IS NULL OR bp.ProviderID = @ProviderID)
        AND (@ProviderTypeID IS NULL OR sp.TypeID = @ProviderTypeID)
        AND (@EventTypeID IS NULL OR b.EventTypeID = @EventTypeID)
        AND p.Status = 'Completed';
END;
GO

-- sp_Refund_Process: Handle refunds
CREATE PROCEDURE sp_Refund_Process
    @PaymentID INT,
    @RefundAmount DECIMAL(18, 2),
    @MethodID INT,
    @TransactionID NVARCHAR(255) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @RefundID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @OriginalAmount DECIMAL(18, 2);
    DECLARE @BookingID INT;
    DECLARE @UserID INT;
    DECLARE @ProviderID INT;

    -- Get original payment details
    SELECT 
        @OriginalAmount = Amount,
        @BookingID = BookingID,
        @UserID = UserID,
        @ProviderID = ProviderID
    FROM Payments
    WHERE PaymentID = @PaymentID;

    IF @OriginalAmount IS NULL
    BEGIN
        RAISERROR('Original payment not found.', 16, 1);
        RETURN;
    END
    
    -- Validate refund amount
    IF @RefundAmount <= 0 OR @RefundAmount > ABS(@OriginalAmount)
    BEGIN
        RAISERROR('Invalid refund amount.', 16, 1);
        RETURN;
    END
    
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Record refund payment (negative amount)
        INSERT INTO Payments (
            BookingID, UserID, ProviderID, Amount, PaymentDate, 
            MethodID, TransactionID, Status, FeeAmount, NetAmount, Notes
        )
        VALUES (
            @BookingID,
            @UserID,
            @ProviderID,
            -@RefundAmount,
            GETDATE(),
            @MethodID,
            @TransactionID,
            'Completed',
            0, -- No fee for refunds
            -@RefundAmount,
            @Notes
        );

        SET @RefundID = SCOPE_IDENTITY();

        -- Update original payment if this is a partial refund
        IF @RefundAmount < ABS(@OriginalAmount)
        BEGIN
            UPDATE Payments
            SET Notes = ISNULL(Notes, '') + ' Partially refunded: ' + FORMAT(@RefundAmount, 'C')
            WHERE PaymentID = @PaymentID;
        END
        
        -- If this is a booking refund, update booking totals
        IF @BookingID IS NOT NULL
        BEGIN
            DECLARE @TotalPaid DECIMAL(18, 2);
            DECLARE @DepositAmount DECIMAL(18, 2);
            DECLARE @DepositPaid BIT;

            -- Get current paid amount
            SELECT @TotalPaid = ISNULL(SUM(Amount), 0)
            FROM Payments
            WHERE BookingID = @BookingID AND Status = 'Completed';

            -- Get deposit info
            SELECT 
                @DepositAmount = DepositAmount,
                @DepositPaid = DepositPaid
            FROM Bookings
            WHERE BookingID = @BookingID;

            -- Check if deposit should be marked as unpaid
            IF @DepositPaid = 1 AND @TotalPaid < @DepositAmount
            BEGIN
                UPDATE Bookings
                SET 
                    DepositPaid = 0,
                    LastUpdated = GETDATE()
                WHERE 
                    BookingID = @BookingID;

                -- Update booking providers
                UPDATE BookingProviders
                SET 
                    DepositPaid = 0,
                    ModifiedDate = GETDATE()
                WHERE 
                    BookingID = @BookingID;

                -- Add timeline event
                INSERT INTO BookingTimeline (
                    BookingID, EventDate, EventType, Title, Description
                )
                VALUES (
                    @BookingID, GETDATE(), 'Payment', 
                    'Deposit Refunded', 
                    'Deposit has been partially refunded. New amount paid: ' + FORMAT(@TotalPaid, 'C')
                );
            END
        END
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;
GO

-- sp_Payment_ProcessPayout: Handle provider payouts
CREATE PROCEDURE sp_Payment_ProcessPayout
    @ProviderID INT,
    @Amount DECIMAL(18, 2),
    @MethodID INT,
    @TransactionID NVARCHAR(255) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @PayoutID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate provider exists
    IF NOT EXISTS (SELECT 1 FROM ServiceProviders WHERE ProviderID = @ProviderID AND IsActive = 1)
    BEGIN
        RAISERROR('Provider not found or inactive.', 16, 1);
        RETURN;
    END
    
    -- Calculate processing fee if method has one
    DECLARE @FeeAmount DECIMAL(18, 2) = 0;
    DECLARE @NetAmount DECIMAL(18, 2) = @Amount;

    SELECT @FeeAmount = @Amount * (ProcessingFeePercent / 100)
    FROM PaymentMethods
    WHERE MethodID = @MethodID;

    SET @NetAmount = @Amount - @FeeAmount;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Record payout
        INSERT INTO Payouts (
            ProviderID, Amount, PayoutDate, MethodID, Status,
            TransactionID, FeeAmount, NetAmount, Notes
        )
        VALUES (
            @ProviderID, @Amount, GETDATE(), @MethodID, 'Completed',
            @TransactionID, @FeeAmount, @NetAmount, @Notes
        );

        SET @PayoutID = SCOPE_IDENTITY();

        -- Record corresponding payment (negative amount from system to provider)
        INSERT INTO Payments (
            BookingID, UserID, ProviderID, Amount, PaymentDate, 
            MethodID, TransactionID, Status, FeeAmount, NetAmount, Notes
        )
        VALUES (
            NULL, -- No booking
            NULL, -- No user
            @ProviderID,
            -@Amount,
            GETDATE(),
            @MethodID,
            @TransactionID,
            'Completed',
            @FeeAmount,
            -@NetAmount, -- Negative net amount
            'Payout to provider: ' + ISNULL(@Notes, '')
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;
GO

-- sp_Financial_GetProviderEarnings: Provider earnings report
CREATE PROCEDURE sp_Financial_GetProviderEarnings
    @ProviderID INT,
    @StartDate DATE = NULL,
    @EndDate DATE = NULL,
    @GroupBy NVARCHAR(20) = 'month' -- day, week, month, quarter, year
AS
BEGIN
    SET NOCOUNT ON;

    -- Set default date range if not provided
    IF @StartDate IS NULL SET @StartDate = DATEADD(YEAR, -1, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();

    -- Validate date range
    IF @EndDate < @StartDate
    BEGIN
        RAISERROR('End date must be after start date.', 16, 1);
        RETURN;
    END
    
    -- Generate report based on grouping
    IF @GroupBy = 'day'
    BEGIN
        SELECT 
            CAST(b.EventDate AS DATE) AS Period,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(bp.Price) AS GrossEarnings,
            SUM(po.Amount) AS PayoutsReceived,
            SUM(po.FeeAmount) AS PayoutFees,
            SUM(bp.Price) - ISNULL(SUM(po.Amount), 0) AS BalanceDue
        FROM 
            Bookings b
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            LEFT JOIN Payouts po ON bp.ProviderID = po.ProviderID AND CAST(po.PayoutDate AS DATE) = CAST(b.EventDate AS DATE)
        WHERE 
            bp.ProviderID = @ProviderID
            AND b.EventDate BETWEEN @StartDate AND @EndDate
            AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        GROUP BY 
            CAST(b.EventDate AS DATE)
        ORDER BY 
            CAST(b.EventDate AS DATE);
    END
    ELSE IF @GroupBy = 'week'
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            DATEPART(WEEK, b.EventDate) AS Week,
            MIN(b.EventDate) AS WeekStartDate,
            MAX(b.EventDate) AS WeekEndDate,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(bp.Price) AS GrossEarnings,
            SUM(po.Amount) AS PayoutsReceived,
            SUM(po.FeeAmount) AS PayoutFees,
            SUM(bp.Price) - ISNULL(SUM(po.Amount), 0) AS BalanceDue
        FROM 
            Bookings b
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            LEFT JOIN Payouts po ON bp.ProviderID = po.ProviderID AND DATEPART(YEAR, po.PayoutDate) = DATEPART(YEAR, b.EventDate) AND DATEPART(WEEK, po.PayoutDate) = DATEPART(WEEK, b.EventDate)
        WHERE 
            bp.ProviderID = @ProviderID
            AND b.EventDate BETWEEN @StartDate AND @EndDate
            AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        GROUP BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(WEEK, b.EventDate)
        ORDER BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(WEEK, b.EventDate);
    END
    ELSE IF @GroupBy = 'month'
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            DATEPART(MONTH, b.EventDate) AS Month,
            FORMAT(b.EventDate, 'yyyy-MM') AS Period,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(bp.Price) AS GrossEarnings,
            SUM(po.Amount) AS PayoutsReceived,
            SUM(po.FeeAmount) AS PayoutFees,
            SUM(bp.Price) - ISNULL(SUM(po.Amount), 0) AS BalanceDue
        FROM 
            Bookings b
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            LEFT JOIN Payouts po ON bp.ProviderID = po.ProviderID AND DATEPART(YEAR, po.PayoutDate) = DATEPART(YEAR, b.EventDate) AND DATEPART(MONTH, po.PayoutDate) = DATEPART(MONTH, b.EventDate)
        WHERE 
            bp.ProviderID = @ProviderID
            AND b.EventDate BETWEEN @StartDate AND @EndDate
            AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        GROUP BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(MONTH, b.EventDate),
            FORMAT(b.EventDate, 'yyyy-MM')
        ORDER BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(MONTH, b.EventDate);
    END
    ELSE IF @GroupBy = 'quarter'
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            DATEPART(QUARTER, b.EventDate) AS Quarter,
            'Q' + CAST(DATEPART(QUARTER, b.EventDate) AS VARCHAR(1)) + ' ' + CAST(DATEPART(YEAR, b.EventDate) AS VARCHAR(4)) AS Period,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(bp.Price) AS GrossEarnings,
            SUM(po.Amount) AS PayoutsReceived,
            SUM(po.FeeAmount) AS PayoutFees,
            SUM(bp.Price) - ISNULL(SUM(po.Amount), 0) AS BalanceDue
        FROM 
            Bookings b
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            LEFT JOIN Payouts po ON bp.ProviderID = po.ProviderID AND DATEPART(YEAR, po.PayoutDate) = DATEPART(YEAR, b.EventDate) AND DATEPART(QUARTER, po.PayoutDate) = DATEPART(QUARTER, b.EventDate)
        WHERE 
            bp.ProviderID = @ProviderID
            AND b.EventDate BETWEEN @StartDate AND @EndDate
            AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        GROUP BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(QUARTER, b.EventDate),
            'Q' + CAST(DATEPART(QUARTER, b.EventDate) AS VARCHAR(1)) + ' ' + CAST(DATEPART(YEAR, b.EventDate) AS VARCHAR(4))
        ORDER BY 
            DATEPART(YEAR, b.EventDate),
            DATEPART(QUARTER, b.EventDate);
    END
    ELSE -- year
    BEGIN
        SELECT 
            DATEPART(YEAR, b.EventDate) AS Year,
            COUNT(DISTINCT b.BookingID) AS BookingCount,
            SUM(bp.Price) AS GrossEarnings,
            SUM(po.Amount) AS PayoutsReceived,
            SUM(po.FeeAmount) AS PayoutFees,
            SUM(bp.Price) - ISNULL(SUM(po.Amount), 0) AS BalanceDue
        FROM 
            Bookings b
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            LEFT JOIN Payouts po ON bp.ProviderID = po.ProviderID AND DATEPART(YEAR, po.PayoutDate) = DATEPART(YEAR, b.EventDate)
        WHERE 
            bp.ProviderID = @ProviderID
            AND b.EventDate BETWEEN @StartDate AND @EndDate
            AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        GROUP BY 
            DATEPART(YEAR, b.EventDate)
        ORDER BY 
            DATEPART(YEAR, b.EventDate);
    END
    
    -- Get summary totals
    SELECT 
        COUNT(DISTINCT b.BookingID) AS TotalBookingCount,
        SUM(bp.Price) AS TotalGrossEarnings,
        SUM(po.Amount) AS TotalPayoutsReceived,
        SUM(po.FeeAmount) AS TotalPayoutFees,
        SUM(bp.Price) - ISNULL(SUM(po.Amount), 0) AS TotalBalanceDue
    FROM 
        Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
        LEFT JOIN Payouts po ON bp.ProviderID = po.ProviderID
    WHERE 
        bp.ProviderID = @ProviderID
        AND b.EventDate BETWEEN @StartDate AND @EndDate
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'));

    -- Get upcoming earnings (confirmed but not yet completed bookings)
    SELECT 
        COUNT(DISTINCT b.BookingID) AS UpcomingBookingCount,
        SUM(bp.Price) AS UpcomingEarnings
    FROM 
        Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
    WHERE 
        bp.ProviderID = @ProviderID
        AND b.EventDate > GETDATE()
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName = 'Confirmed');
END;
GO



/*
============================================================
14_ Stored Procedures - Calendar.sql
============================================================
*/

-- Section 14: Stored Procedures - Calendar

-- sp_Calendar_GetAvailability: Get provider availability
CREATE PROCEDURE sp_Calendar_GetAvailability
    @ProviderID INT,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate date range
    IF @EndDate < @StartDate
    BEGIN
        RAISERROR('End date must be after start date.', 16, 1);
        RETURN;
    END
    
    -- Create temp table for dates
    CREATE TABLE #DateRange (
        DateValue DATE
    );
    
    -- Populate date range
    DECLARE @CurrentDate DATE = @StartDate;
    
    WHILE @CurrentDate <= @EndDate
    BEGIN
        INSERT INTO #DateRange (DateValue) VALUES (@CurrentDate);
        SET @CurrentDate = DATEADD(DAY, 1, @CurrentDate);
    END
    
    -- Get provider's weekly availability
    DECLARE @WeeklyAvailability TABLE (
        DayOfWeek TINYINT,
        StartTime TIME,
        EndTime TIME,
        IsAvailable BIT
    );
    
    INSERT INTO @WeeklyAvailability
    SELECT 
        DayOfWeek,
        StartTime,
        EndTime,
        IsAvailable
    FROM 
        ProviderAvailability
    WHERE 
        ProviderID = @ProviderID;
    
    -- Get blackout dates
    DECLARE @BlackoutDates TABLE (
        StartDate DATE,
        EndDate DATE,
        Reason NVARCHAR(255)
    );
    
    INSERT INTO @BlackoutDates
    SELECT 
        StartDate,
        EndDate,
        Reason
    FROM 
        ProviderBlackoutDates
    WHERE 
        ProviderID = @ProviderID
        AND (
            (StartDate <= @EndDate AND EndDate >= @StartDate) OR
            IsRecurring = 1
        );
    
    -- Get booked dates
    DECLARE @BookedDates TABLE (
        EventDate DATE,
        StartTime TIME,
        EndTime TIME
    );
    
    INSERT INTO @BookedDates
    SELECT 
        b.EventDate,
        b.StartTime,
        b.EndTime
    FROM 
        Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
    WHERE 
        bp.ProviderID = @ProviderID
        AND b.EventDate BETWEEN @StartDate AND @EndDate
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'));
    
    -- Return availability for each date
    SELECT 
        dr.DateValue,
        wa.DayOfWeek,
        wa.StartTime AS DefaultStartTime,
        wa.EndTime AS DefaultEndTime,
        wa.IsAvailable AS DefaultAvailable,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM @BlackoutDates bd 
                WHERE dr.DateValue BETWEEN bd.StartDate AND bd.EndDate
            ) THEN 0
            WHEN EXISTS (
                SELECT 1 FROM @BookedDates bd 
                WHERE bd.EventDate = dr.DateValue
            ) THEN 0
            WHEN EXISTS (
                SELECT 1 FROM @WeeklyAvailability wa2 
                WHERE wa2.DayOfWeek = DATEPART(WEEKDAY, dr.DateValue) 
                AND wa2.IsAvailable = 1
            ) THEN 1
            ELSE 0
        END AS IsAvailable,
        (
            SELECT STRING_AGG(CONVERT(NVARCHAR(5), bd.StartTime) + ' - ' + CONVERT(NVARCHAR(5), bd.EndTime), ', ')
            FROM @BookedDates bd 
            WHERE bd.EventDate = dr.DateValue
        ) AS BookedSlots,
        (
            SELECT TOP 1 bd.Reason 
            FROM @BlackoutDates bd 
            WHERE dr.DateValue BETWEEN bd.StartDate AND bd.EndDate
        ) AS BlackoutReason
    FROM 
        #DateRange dr
        LEFT JOIN @WeeklyAvailability wa ON wa.DayOfWeek = DATEPART(WEEKDAY, dr.DateValue)
    ORDER BY 
        dr.DateValue;
    
    DROP TABLE #DateRange;
END;
GO

-- sp_Calendar_BlockDates: Mark dates as unavailable
CREATE PROCEDURE sp_Calendar_BlockDates
    @ProviderID INT,
    @StartDate DATE,
    @EndDate DATE,
    @Reason NVARCHAR(255) = NULL,
    @IsRecurring BIT = 0,
    @RecurrencePattern NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate date range
    IF @EndDate < @StartDate
    BEGIN
        RAISERROR('End date must be after start date.', 16, 1);
        RETURN;
    END
    
    -- Check for existing bookings in this range
    IF EXISTS (
        SELECT 1 
        FROM Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
        WHERE bp.ProviderID = @ProviderID
        AND b.EventDate BETWEEN @StartDate AND @EndDate
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
    )
    BEGIN
        RAISERROR('Cannot block dates with existing bookings.', 16, 1);
        RETURN;
    END
    
    -- Insert blackout dates
    INSERT INTO ProviderBlackoutDates (
        ProviderID, StartDate, EndDate, Reason, IsRecurring, RecurrencePattern
    )
    VALUES (
        @ProviderID, @StartDate, @EndDate, @Reason, @IsRecurring, @RecurrencePattern
    );
END;
GO

-- sp_Calendar_GetConflicts: Identify booking conflicts
CREATE PROCEDURE sp_Calendar_GetConflicts
    @ProviderID INT,
    @StartDate DATE,
    @EndDate DATE,
    @StartTime TIME,
    @EndTime TIME,
    @ExcludeBookingID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate time range
    IF @EndTime <= @StartTime
    BEGIN
        RAISERROR('End time must be after start time.', 16, 1);
        RETURN;
    END
    
    -- Check blackout dates
    SELECT 
        'Blackout' AS ConflictType,
        StartDate,
        EndDate,
        Reason AS ConflictReason
    FROM 
        ProviderBlackoutDates
    WHERE 
        ProviderID = @ProviderID
        AND (
            (@StartDate BETWEEN StartDate AND EndDate) OR
            (@EndDate BETWEEN StartDate AND EndDate) OR
            (StartDate BETWEEN @StartDate AND @EndDate) OR
            (EndDate BETWEEN @StartDate AND @EndDate)
        );
    
    -- Check existing bookings
    SELECT 
        'Booking' AS ConflictType,
        b.EventDate AS StartDate,
        b.EventDate AS EndDate,
        b.StartTime,
        b.EndTime,
        b.EventName AS ConflictReason,
        b.BookingID
    FROM 
        Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
    WHERE 
        bp.ProviderID = @ProviderID
        AND b.EventDate BETWEEN @StartDate AND @EndDate
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        AND (@ExcludeBookingID IS NULL OR b.BookingID <> @ExcludeBookingID)
        AND (
            (@StartTime >= b.StartTime AND @StartTime < b.EndTime) OR
            (@EndTime > b.StartTime AND @EndTime <= b.EndTime) OR
            (@StartTime <= b.StartTime AND @EndTime >= b.EndTime)
        );
    
    -- Check weekly availability
    DECLARE @DayOfWeek INT = DATEPART(WEEKDAY, @StartDate);
    
    IF NOT EXISTS (
        SELECT 1 
        FROM ProviderAvailability 
        WHERE ProviderID = @ProviderID
        AND DayOfWeek = @DayOfWeek
        AND IsAvailable = 1
        AND @StartTime >= StartTime 
        AND @EndTime <= EndTime
    )
    BEGIN
        SELECT 
            'Availability' AS ConflictType,
            @StartDate AS StartDate,
            @EndDate AS EndDate,
            'Provider is not available at the requested time on this day of week.' AS ConflictReason;
    END
END;
GO



/*
============================================================
15_ Functions.sql
============================================================
*/

-- Section 15: Functions

-- Calculate distance between two points (in miles)
CREATE FUNCTION fn_CalculateDistanceMiles
(
    @Lat1 DECIMAL(10, 8),
    @Lon1 DECIMAL(11, 8),
    @Lat2 DECIMAL(10, 8),
    @Lon2 DECIMAL(11, 8)
)
RETURNS FLOAT
AS
BEGIN
    DECLARE @EarthRadius FLOAT = 3958.8; -- miles
    DECLARE @dLat FLOAT = RADIANS(@Lat2 - @Lat1);
    DECLARE @dLon FLOAT = RADIANS(@Lon2 - @Lon1);
    DECLARE @a FLOAT = SIN(@dLat / 2) * SIN(@dLat / 2) + 
                      COS(RADIANS(@Lat1)) * COS(RADIANS(@Lat2)) * 
                      SIN(@dLon / 2) * SIN(@dLon / 2);
    DECLARE @c FLOAT = 2 * ATN2(SQRT(@a), SQRT(1 - @a));
    DECLARE @Distance FLOAT = @EarthRadius * @c;
    RETURN @Distance;
END;
GO

-- Check if a date is within a provider's availability
CREATE FUNCTION fn_IsProviderAvailable
(
    @ProviderID INT,
    @Date DATE,
    @StartTime TIME,
    @EndTime TIME
)
RETURNS BIT
AS
BEGIN
    DECLARE @IsAvailable BIT = 0;
    
    -- Check blackout dates first
    IF EXISTS (
        SELECT 1 FROM ProviderBlackoutDates 
        WHERE ProviderID = @ProviderID 
        AND @Date BETWEEN StartDate AND EndDate
    )
    BEGIN
        RETURN 0;
    END
    
    -- Check existing bookings
    IF EXISTS (
        SELECT 1 FROM Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
        WHERE bp.ProviderID = @ProviderID
        AND b.EventDate = @Date
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        AND (
            (@StartTime >= b.StartTime AND @StartTime < b.EndTime) OR
            (@EndTime > b.StartTime AND @EndTime <= b.EndTime) OR
            (@StartTime <= b.StartTime AND @EndTime >= b.EndTime)
        )
    )
    BEGIN
        RETURN 0;
    END
    
    -- Check weekly availability
    DECLARE @DayOfWeek INT = DATEPART(WEEKDAY, @Date);
    IF EXISTS (
        SELECT 1 FROM ProviderAvailability 
        WHERE ProviderID = @ProviderID
        AND DayOfWeek = @DayOfWeek
        AND IsAvailable = 1
        AND @StartTime >= StartTime 
        AND @EndTime <= EndTime
    )
    BEGIN
        SET @IsAvailable = 1;
    END
    
    RETURN @IsAvailable;
END;
GO

-- Calculate booking price with dynamic pricing
CREATE FUNCTION fn_CalculateBookingPrice
(
    @ProviderID INT,
    @EventDate DATE,
    @BasePrice DECIMAL(18, 2),
    @ServiceIDs NVARCHAR(MAX) = NULL, -- JSON array of service IDs
    @PackageID INT = NULL
)
RETURNS DECIMAL(18, 2)
AS
BEGIN
    DECLARE @TotalPrice DECIMAL(18, 2) = 0;
    DECLARE @PriceMultiplier DECIMAL(5, 2) = 1.0;
    
    -- Check for pricing tiers
    SELECT @PriceMultiplier = PriceMultiplier
    FROM PricingTiers
    WHERE 
        (ProviderID = @ProviderID OR ProviderTypeID = (SELECT TypeID FROM ServiceProviders WHERE ProviderID = @ProviderID))
        AND @EventDate BETWEEN StartDate AND EndDate
        AND IsActive = 1
    ORDER BY 
        ProviderID DESC -- Prefer provider-specific over type-specific
    OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY;
    
    -- Calculate price based on services/packages
    IF @PackageID IS NOT NULL
    BEGIN
        -- Package pricing
        SELECT @TotalPrice = Price
        FROM ProviderServicePackages
        WHERE PackageID = @PackageID AND ProviderID = @ProviderID AND IsActive = 1;
    END
    ELSE IF @ServiceIDs IS NOT NULL
    BEGIN
        -- Individual services pricing
        SELECT @TotalPrice = SUM(BasePrice)
        FROM ProviderServices
        WHERE ProviderServiceID IN (SELECT value FROM OPENJSON(@ServiceIDs))
        AND ProviderID = @ProviderID AND IsActive = 1;
    END
    ELSE
    BEGIN
        -- Base price only
        SET @TotalPrice = @BasePrice;
    END
    
    -- Apply price multiplier
    SET @TotalPrice = @TotalPrice * @PriceMultiplier;
    RETURN @TotalPrice;
END;
GO



/*
============================================================
16_ Initial Data Setup.sql
============================================================
*/

-- Section 16: Initial Data Setup

-- Insert default user roles
INSERT INTO UserRoles (RoleName, Description, IsActive)
VALUES 
    ('Admin', 'System administrator with full access', 1),
    ('ServiceProvider', 'Service provider account', 1),
    ('Customer', 'Regular customer account', 1);
GO

-- Insert default booking statuses
INSERT INTO BookingStatuses (StatusName, Description, IsActive)
VALUES 
    ('Pending', 'Booking is pending payment or confirmation', 1),
    ('Confirmed', 'Booking is confirmed and deposit paid', 1),
    ('Completed', 'Booking has been completed', 1),
    ('Cancelled', 'Booking has been cancelled', 1);
GO

-- Insert default provider types
INSERT INTO ProviderTypes (TypeName, Category, IconClass, Description, IsActive, DisplayOrder)
VALUES 
    ('Venue', 'Location', 'fa-building', 'Wedding and event venues', 1, 1),
    ('DJ', 'Entertainment', 'fa-music', 'Disc jockeys and music entertainment', 1, 2),
    ('Photographer', 'Services', 'fa-camera', 'Photography services', 1, 3),
    ('Videographer', 'Services', 'fa-video', 'Videography services', 1, 4),
    ('Caterer', 'Food', 'fa-utensils', 'Catering services', 1, 5),
    ('Florist', 'Decor', 'fa-leaf', 'Floral arrangements', 1, 6),
    ('Baker', 'Food', 'fa-birthday-cake', 'Wedding cakes and desserts', 1, 7),
    ('Planner', 'Services', 'fa-clipboard-list', 'Event planning services', 1, 8),
    ('Officiant', 'Services', 'fa-user-tie', 'Wedding officiants', 1, 9),
    ('Transportation', 'Services', 'fa-car', 'Transportation services', 1, 10);
GO

-- Insert default event types
INSERT INTO EventTypes (TypeName, Description, IconClass, IsActive)
VALUES 
    ('Wedding', 'Wedding ceremony and reception', 'fa-ring', 1),
    ('Corporate', 'Corporate event or meeting', 'fa-briefcase', 1),
    ('Birthday', 'Birthday party', 'fa-birthday-cake', 1),
    ('Anniversary', 'Anniversary celebration', 'fa-glass-cheers', 1),
    ('Graduation', 'Graduation party', 'fa-graduation-cap', 1),
    ('Baby Shower', 'Baby shower', 'fa-baby', 1),
    ('Engagement', 'Engagement party', 'fa-gem', 1),
    ('Holiday', 'Holiday party', 'fa-holly-berry', 1),
    ('Fundraiser', 'Fundraising event', 'fa-hand-holding-usd', 1),
    ('Other', 'Other type of event', 'fa-calendar-alt', 1);
GO

-- Insert default payment methods
INSERT INTO PaymentMethods (MethodName, IsOnline, ProcessingFeePercent, IsActive)
VALUES 
    ('Credit Card', 1, 2.9, 1),
    ('Debit Card', 1, 1.5, 1),
    ('PayPal', 1, 2.5, 1),
    ('Bank Transfer', 1, 0.5, 1),
    ('Check', 0, 0.0, 1),
    ('Cash', 0, 0.0, 1),
    ('Venmo', 1, 1.9, 1),
    ('Apple Pay', 1, 1.5, 1),
    ('Google Pay', 1, 1.5, 1);
GO

-- Insert default review categories for venues
INSERT INTO ReviewCategories (ProviderTypeID, CategoryName, Description, IsActive)
SELECT 
    TypeID,
    CategoryName,
    Description,
    1
FROM (
    VALUES 
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Venue'), 'Location', 'Quality and appeal of the location'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Venue'), 'Cleanliness', 'Cleanliness of the venue'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Venue'), 'Staff', 'Friendliness and helpfulness of staff'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Venue'), 'Value', 'Value for the price'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Venue'), 'Amenities', 'Quality of amenities provided'),
        
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'DJ'), 'Music Selection', 'Variety and quality of music selection'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'DJ'), 'Equipment', 'Quality of sound equipment'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'DJ'), 'Professionalism', 'Professionalism of the DJ'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'DJ'), 'Interaction', 'Interaction with guests'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'DJ'), 'Timing', 'Keeping to schedule and reading the crowd'),
        
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Photographer'), 'Photo Quality', 'Quality of the photographs'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Photographer'), 'Professionalism', 'Professionalism of the photographer'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Photographer'), 'Creativity', 'Creativity in shots and angles'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Photographer'), 'Delivery Time', 'Timeliness of delivering photos'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Photographer'), 'Personality', 'Comfort level with the photographer')
) AS Categories(ProviderTypeID, CategoryName, Description);
GO

-- Insert default system settings
INSERT INTO SystemSettings (SettingKey, SettingValue, Description, IsPublic)
VALUES 
    ('SiteName', 'EventBookingPlatform', 'Name of the website', 1),
    ('SiteDescription', 'Book venues and services for your events', 'Website description', 1),
    ('DefaultCurrency', 'USD', 'Default currency for pricing', 1),
    ('TaxRate', '0.1', 'Default tax rate (10%)', 1),
    ('DepositPercentage', '0.3', 'Default deposit percentage (30%)', 1),
    ('CancellationPolicy', 'Full refund if cancelled more than 30 days before event. 50% refund if cancelled 7-30 days before. No refund if cancelled less than 7 days before.', 'Cancellation policy text', 1),
    ('MaxImageSizeMB', '5', 'Maximum image upload size in MB', 0),
    ('AllowedImageTypes', 'image/jpeg,image/png', 'Allowed image MIME types', 0),
    ('BookingLeadTimeHours', '24', 'Minimum hours required before a booking', 0),
    ('DefaultPaginationSize', '10', 'Default number of items per page', 0);
GO



/*
============================================================
17_ Security and Permissions.sql
============================================================
*/

-- Section 17: Security and Permissions

-- Create database roles
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'EventBookingAdmin' AND type = 'R')
BEGIN
    CREATE ROLE EventBookingAdmin;
    GRANT CONTROL ON DATABASE::EventBookingPlatform TO EventBookingAdmin;
END
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'EventBookingProvider' AND type = 'R')
BEGIN
    CREATE ROLE EventBookingProvider;
    -- Basic read permissions
    GRANT SELECT ON SCHEMA::dbo TO EventBookingProvider;
    -- Provider-specific permissions
    GRANT INSERT, UPDATE ON ServiceProviders TO EventBookingProvider;
    GRANT INSERT, UPDATE ON ProviderServices TO EventBookingProvider;
    GRANT INSERT, UPDATE ON ProviderServicePackages TO EventBookingProvider;
    GRANT INSERT, UPDATE ON ProviderAvailability TO EventBookingProvider;
    GRANT INSERT, UPDATE ON ProviderBlackoutDates TO EventBookingProvider;
    GRANT INSERT, UPDATE ON ProviderEquipment TO EventBookingProvider;
    GRANT INSERT, UPDATE ON ProviderPortfolio TO EventBookingProvider;
    GRANT INSERT, UPDATE ON ProviderLocations TO EventBookingProvider;
    -- Booking-related permissions
    GRANT SELECT, UPDATE ON Bookings TO EventBookingProvider;
    GRANT SELECT, UPDATE ON BookingProviders TO EventBookingProvider;
    GRANT SELECT, INSERT, UPDATE ON BookingMessages TO EventBookingProvider;
    GRANT SELECT ON BookingTimeline TO EventBookingProvider;
    -- Financial permissions
    GRANT SELECT ON Payments TO EventBookingProvider;
    GRANT SELECT ON Payouts TO EventBookingProvider;
    GRANT SELECT ON Invoices TO EventBookingProvider;
END
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'EventBookingCustomer' AND type = 'R')
BEGIN
    CREATE ROLE EventBookingCustomer;
    -- Basic read permissions
    GRANT SELECT ON SCHEMA::dbo TO EventBookingCustomer;
    -- User-specific permissions
    GRANT INSERT, UPDATE ON Users TO EventBookingCustomer;
    GRANT INSERT, UPDATE ON UserPreferences TO EventBookingCustomer;
    GRANT INSERT, UPDATE ON UserSocialLogins TO EventBookingCustomer;
    GRANT INSERT, UPDATE ON Wishlists TO EventBookingCustomer;
    -- Booking-related permissions
    GRANT INSERT, SELECT, UPDATE ON Bookings TO EventBookingCustomer;
    GRANT SELECT ON BookingProviders TO EventBookingCustomer;
    GRANT SELECT, INSERT ON BookingMessages TO EventBookingCustomer;
    GRANT SELECT ON BookingTimeline TO EventBookingCustomer;
    -- Financial permissions
    GRANT SELECT, INSERT ON Payments TO EventBookingCustomer;
    GRANT SELECT ON Invoices TO EventBookingCustomer;
END
GO

-- Create application user
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'EventBookingApp' AND type = 'S')
BEGIN
    CREATE USER EventBookingApp WITH PASSWORD = 'StrongPassword123!';
    GRANT CONNECT TO EventBookingApp;
    GRANT EXECUTE ON SCHEMA::dbo TO EventBookingApp;
END
GO



/*
============================================================
18_ Audit Triggers.sql
============================================================
*/

-- Section 18: Audit Triggers

-- Create audit trigger for Users table
CREATE TRIGGER tr_Users_Audit
ON Users
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ActionType NVARCHAR(50);
    
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @ActionType = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @ActionType = 'INSERT';
    ELSE
        SET @ActionType = 'DELETE';
    
    -- Get current user from application context or system user
    DECLARE @CurrentUser NVARCHAR(128);
    SET @CurrentUser = ISNULL(CAST(CONTEXT_INFO() AS NVARCHAR(128)), SYSTEM_USER);
    
    -- Log changes
    INSERT INTO AuditLogs (UserID, ActionType, TableName, RecordID, OldValues, NewValues, IPAddress)
    SELECT 
        ISNULL(i.UserID, d.UserID),
        @ActionType,
        'Users',
        ISNULL(CAST(i.UserID AS NVARCHAR(100)), CAST(d.UserID AS NVARCHAR(100))),
        (SELECT d.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
        (SELECT i.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
        NULL -- IP would be set by application
    FROM 
        inserted i
        FULL OUTER JOIN deleted d ON i.UserID = d.UserID
    WHERE 
        (i.UserID IS NOT NULL OR d.UserID IS NOT NULL);
END;
GO

-- Create audit trigger for Bookings table
CREATE TRIGGER tr_Bookings_Audit
ON Bookings
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ActionType NVARCHAR(50);
    
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @ActionType = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @ActionType = 'INSERT';
    ELSE
        SET @ActionType = 'DELETE';
    
    -- Get current user from application context or system user
    DECLARE @CurrentUser NVARCHAR(128);
    SET @CurrentUser = ISNULL(CAST(CONTEXT_INFO() AS NVARCHAR(128)), SYSTEM_USER);
    
    -- Log changes
    INSERT INTO AuditLogs (UserID, ActionType, TableName, RecordID, OldValues, NewValues, IPAddress)
    SELECT 
        ISNULL(i.UserID, d.UserID),
        @ActionType,
        'Bookings',
        ISNULL(CAST(i.BookingID AS NVARCHAR(100)), CAST(d.BookingID AS NVARCHAR(100))),
        (SELECT d.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
        (SELECT i.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
        NULL -- IP would be set by application
    FROM 
        inserted i
        FULL OUTER JOIN deleted d ON i.BookingID = d.BookingID
    WHERE 
        (i.BookingID IS NOT NULL OR d.BookingID IS NOT NULL);
END;
GO



/*
============================================================
19_ Maintenance Procedures.sql
============================================================
*/

-- Section 19: Maintenance Procedures

-- Procedure to clean up old sessions
CREATE PROCEDURE sp_CleanupOldSessions
    @DaysToKeep INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM UserSessions
    WHERE ExpiryDate < GETDATE() OR LastActivityDate < DATEADD(DAY, -@DaysToKeep, GETDATE());
    
    RETURN @@ROWCOUNT;
END;
GO

-- Procedure to archive old bookings
CREATE PROCEDURE sp_ArchiveCompletedBookings
    @MonthsToKeep INT = 12
AS
BEGIN
    SET NOCOUNT ON;
    
    -- In a real system, you would move these to an archive table first
    -- This is just a simplified example
    
    DECLARE @ArchivedCount INT = 0;
    
    -- Archive bookings completed more than @MonthsToKeep ago
    SELECT @ArchivedCount = COUNT(*)
    FROM Bookings b
    INNER JOIN BookingStatuses bs ON b.StatusID = bs.StatusID
    WHERE bs.StatusName = 'Completed'
    AND b.EventDate < DATEADD(MONTH, -@MonthsToKeep, GETDATE());
    
    -- In a real implementation, you would:
    -- 1. Insert into archive tables
    -- 2. Delete related records (messages, timeline events, etc.)
    -- 3. Delete the bookings
    
    -- For this example, we'll just return the count that would be archived
    RETURN @ArchivedCount;
END;
GO

-- Procedure to rebuild indexes
CREATE PROCEDURE sp_RebuildIndexes
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TableName NVARCHAR(255);
    DECLARE @SQL NVARCHAR(500);
    
    DECLARE TableCursor CURSOR FOR
    SELECT table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'sys%';
    
    OPEN TableCursor;
    FETCH NEXT FROM TableCursor INTO @TableName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @SQL = 'ALTER INDEX ALL ON ' + @TableName + ' REBUILD';
        EXEC sp_executesql @SQL;
        FETCH NEXT FROM TableCursor INTO @TableName;
    END
    
    CLOSE TableCursor;
    DEALLOCATE TableCursor;
END;
GO



/*
============================================================
20_ Backup and Recovery Plan.sql
============================================================
*/

-- Section 20: Backup and Recovery Plan

/*
Recommended backup strategy for production:

1. Full backups: Daily at 2 AM
   BACKUP DATABASE EventBookingPlatform 
   TO DISK = 'D:\Backups\EventBookingPlatform_Full.bak'
   WITH COMPRESSION, CHECKSUM;
GO
2. Differential backups: Every 4 hours during business hours
   BACKUP DATABASE EventBookingPlatform 
   TO DISK = 'D:\Backups\EventBookingPlatform_Diff.bak'
   WITH DIFFERENTIAL, COMPRESSION, CHECKSUM;
GO
3. Transaction log backups: Every 15 minutes
   BACKUP LOG EventBookingPlatform 
   TO DISK = 'D:\Backups\EventBookingPlatform_Log.trn'
   WITH COMPRESSION, CHECKSUM;
GO
4. Verify backups regularly:
   RESTORE VERIFYONLY 
   FROM DISK = 'D:\Backups\EventBookingPlatform_Full.bak';
GO
5. Implement a backup retention policy (e.g., keep 30 days of backups)

For point-in-time recovery:
   RESTORE DATABASE EventBookingPlatform 
   FROM DISK = 'D:\Backups\EventBookingPlatform_Full.bak'
   WITH NORECOVERY;
GO
   RESTORE DATABASE EventBookingPlatform 
   FROM DISK = 'D:\Backups\EventBookingPlatform_Diff.bak'
   WITH NORECOVERY;
GO
   RESTORE LOG EventBookingPlatform 
   FROM DISK = 'D:\Backups\EventBookingPlatform_Log.trn'
   WITH STOPAT = '2023-11-15 14:00:00', RECOVERY;
GO
*/

