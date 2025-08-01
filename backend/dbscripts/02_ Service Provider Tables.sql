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
