CREATE TABLE [dbo].[Users] (
    [UserID]                  INT            IDENTITY (1, 1) NOT NULL,
    [Name]                    NVARCHAR (100) NOT NULL,
    [Email]                   NVARCHAR (100) NOT NULL,
    [PasswordHash]            NVARCHAR (255) NULL,
    [ProfileImageURL]         NVARCHAR (255) NULL,
    [Phone]                   NVARCHAR (20)  NULL,
    [Bio]                     NVARCHAR (MAX) NULL,
    [IsVendor]                BIT            DEFAULT ((0)) NULL,
    [IsAdmin]                 BIT            DEFAULT ((0)) NULL,
    [EmailVerified]           BIT            DEFAULT ((0)) NULL,
    [CreatedAt]               DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]               DATETIME       DEFAULT (getdate()) NULL,
    [LastLogin]               DATETIME       NULL,
    [AuthProvider]            NVARCHAR (20)  DEFAULT ('email') NULL,
    [StripeCustomerID]        NVARCHAR (100) NULL,
    [NotificationPreferences] NVARCHAR (MAX) DEFAULT ('{"email":true,"push":true}') NULL,
    [IsActive]                BIT            DEFAULT ((1)) NULL,
    PRIMARY KEY CLUSTERED ([UserID] ASC),
    UNIQUE NONCLUSTERED ([Email] ASC)
);


GO

