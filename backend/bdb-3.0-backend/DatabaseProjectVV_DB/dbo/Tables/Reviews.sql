CREATE TABLE [dbo].[Reviews] (
    [ReviewID]        INT            IDENTITY (1, 1) NOT NULL,
    [UserID]          INT            NULL,
    [VendorProfileID] INT            NULL,
    [BookingID]       INT            NULL,
    [Rating]          TINYINT        NOT NULL,
    [Title]           NVARCHAR (100) NULL,
    [Comment]         NVARCHAR (MAX) NULL,
    [Response]        NVARCHAR (MAX) NULL,
    [ResponseDate]    DATETIME       NULL,
    [IsAnonymous]     BIT            DEFAULT ((0)) NULL,
    [IsFeatured]      BIT            DEFAULT ((0)) NULL,
    [IsApproved]      BIT            DEFAULT ((0)) NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [IsFlagged]       BIT            DEFAULT ((0)) NULL,
    [FlagReason]      NVARCHAR (255) NULL,
    [AdminNotes]      NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([ReviewID] ASC),
    CHECK ([Rating]>=(1) AND [Rating]<=(5)),
    FOREIGN KEY ([BookingID]) REFERENCES [dbo].[Bookings] ([BookingID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO


CREATE TRIGGER tr_Reviews_UpdateMetrics
ON Reviews
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vp
    SET 
        TotalReviews = ISNULL(r.ReviewCount, 0),
        AvgRating = r.AvgRating,
        LastReviewDate = r.LastReviewDate
    FROM VendorProfiles vp
    LEFT JOIN (
        SELECT 
            VendorProfileID,
            COUNT(*) AS ReviewCount,
            AVG(CAST(Rating AS FLOAT)) AS AvgRating,
            MAX(CreatedAt) AS LastReviewDate
        FROM Reviews
        GROUP BY VendorProfileID
    ) r ON vp.VendorProfileID = r.VendorProfileID
    WHERE vp.VendorProfileID IN (
        SELECT DISTINCT VendorProfileID FROM inserted
        UNION
        SELECT DISTINCT VendorProfileID FROM deleted
    );
END

GO

