CREATE TABLE [dbo].[VendorProfileViews] (
    [ViewID]          INT            IDENTITY (1, 1) NOT NULL,
    [VendorProfileID] INT            NOT NULL,
    [ViewerUserID]    INT            NULL,
    [ViewedAt]        DATETIME2 (7)  DEFAULT (getutcdate()) NOT NULL,
    [IPAddress]       VARCHAR (45)   NULL,
    [UserAgent]       VARCHAR (500)  NULL,
    [ReferrerUrl]     VARCHAR (1000) NULL,
    [SessionID]       VARCHAR (100)  NULL,
    PRIMARY KEY CLUSTERED ([ViewID] ASC),
    CONSTRAINT [FK_VendorProfileViews_User] FOREIGN KEY ([ViewerUserID]) REFERENCES [dbo].[Users] ([UserID]) ON DELETE SET NULL,
    CONSTRAINT [FK_VendorProfileViews_VendorProfile] FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_VendorProfileViews_VendorProfileID_ViewedAt]
    ON [dbo].[VendorProfileViews]([VendorProfileID] ASC, [ViewedAt] DESC);


GO

CREATE NONCLUSTERED INDEX [IX_VendorProfileViews_ViewerUserID]
    ON [dbo].[VendorProfileViews]([ViewerUserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_VendorProfileViews_VendorProfileID]
    ON [dbo].[VendorProfileViews]([VendorProfileID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_VendorProfileViews_ViewedAt]
    ON [dbo].[VendorProfileViews]([ViewedAt] DESC);


GO

