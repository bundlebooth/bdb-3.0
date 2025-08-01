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

