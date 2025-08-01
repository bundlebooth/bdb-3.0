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
