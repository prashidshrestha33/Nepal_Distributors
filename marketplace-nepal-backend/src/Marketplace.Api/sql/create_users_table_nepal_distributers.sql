-- create_users_table_nepal_distributers.sql
-- Creates NepalDistributers DB and dbo.users table (if missing). Run in SSMS or sqlcmd.

SET NOCOUNT ON;

IF DB_ID('NepalDistributers') IS NULL
BEGIN
    CREATE DATABASE NepalDistributers;
END
GO

USE NepalDistributers;
GO

IF OBJECT_ID('dbo.users','U') IS NULL
BEGIN
CREATE TABLE dbo.users (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  company_id BIGINT NULL,
  email NVARCHAR(320) NOT NULL,
  password_hash NVARCHAR(200) NULL,
  full_name NVARCHAR(400) NULL,
  phone NVARCHAR(50) NULL,
  role NVARCHAR(50) NOT NULL DEFAULT('retailer'),
  status NVARCHAR(50) NOT NULL DEFAULT('pending'),
  credits BIGINT NOT NULL DEFAULT(0),
  tier NVARCHAR(100) NULL,
  created_at DATETIMEOFFSET(3) NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET(3) NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  approve_dt CHAR(1) NULL,
  approve_ts DATETIMEOFFSET(3) NULL DEFAULT SYSDATETIMEOFFSET(),
  last_login_at DATETIMEOFFSET(3) NULL
);

ALTER TABLE dbo.users ADD CONSTRAINT CHK_users_role CHECK (role IN ('super_admin','portal_manager','importer','manufacturer','wholesaler','retailer'));
ALTER TABLE dbo.users ADD CONSTRAINT CHK_users_status CHECK (status IN ('active','pending','deactivated','blocked'));

CREATE UNIQUE INDEX UX_users_email ON dbo.users(email);
END
GO
