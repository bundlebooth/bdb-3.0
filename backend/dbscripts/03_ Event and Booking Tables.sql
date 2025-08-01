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
