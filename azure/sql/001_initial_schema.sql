-- Run against the AutoMaster Azure SQL database as a database administrator.
IF OBJECT_ID(N'dbo.Vehicles', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Vehicles (
    id uniqueidentifier NOT NULL CONSTRAINT DF_Vehicles_id DEFAULT NEWID() PRIMARY KEY,
    slug nvarchar(180) NOT NULL CONSTRAINT UQ_Vehicles_slug UNIQUE,
    make nvarchar(80) NOT NULL,
    model nvarchar(120) NOT NULL,
    year int NOT NULL CONSTRAINT CK_Vehicles_year CHECK (year BETWEEN 1950 AND 2035),
    price decimal(12,2) NOT NULL CONSTRAINT CK_Vehicles_price CHECK (price >= 0),
    mileage int NOT NULL CONSTRAINT DF_Vehicles_mileage DEFAULT 0 CONSTRAINT CK_Vehicles_mileage CHECK (mileage >= 0),
    fuel nvarchar(40) NOT NULL CONSTRAINT DF_Vehicles_fuel DEFAULT N'Petrol',
    transmission nvarchar(40) NOT NULL CONSTRAINT DF_Vehicles_transmission DEFAULT N'Automatic',
    body_style nvarchar(40) NOT NULL CONSTRAINT DF_Vehicles_body_style DEFAULT N'Other',
    exterior_color nvarchar(80) NOT NULL CONSTRAINT DF_Vehicles_color DEFAULT N'',
    description nvarchar(max) NOT NULL CONSTRAINT DF_Vehicles_description DEFAULT N'',
    image_url nvarchar(1000) NULL,
    status nvarchar(20) NOT NULL CONSTRAINT DF_Vehicles_status DEFAULT N'available' CONSTRAINT CK_Vehicles_status CHECK (status IN (N'available',N'reserved',N'sold')),
    featured bit NOT NULL CONSTRAINT DF_Vehicles_featured DEFAULT 0,
    created_at datetime2(3) NOT NULL CONSTRAINT DF_Vehicles_created DEFAULT SYSUTCDATETIME(),
    updated_at datetime2(3) NOT NULL CONSTRAINT DF_Vehicles_updated DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_Vehicles_status_featured_created ON dbo.Vehicles(status, featured DESC, created_at DESC);
  CREATE INDEX IX_Vehicles_make_price ON dbo.Vehicles(make, price);
END;
GO

IF OBJECT_ID(N'dbo.Enquiries', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Enquiries (
    id uniqueidentifier NOT NULL CONSTRAINT DF_Enquiries_id DEFAULT NEWID() PRIMARY KEY,
    vehicle_id uniqueidentifier NULL,
    customer_name nvarchar(120) NOT NULL,
    email nvarchar(320) NOT NULL,
    phone nvarchar(80) NOT NULL CONSTRAINT DF_Enquiries_phone DEFAULT N'',
    message nvarchar(4000) NOT NULL,
    status nvarchar(20) NOT NULL CONSTRAINT DF_Enquiries_status DEFAULT N'new' CONSTRAINT CK_Enquiries_status CHECK (status IN (N'new',N'contacted',N'closed')),
    created_at datetime2(3) NOT NULL CONSTRAINT DF_Enquiries_created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Enquiries_Vehicles FOREIGN KEY (vehicle_id) REFERENCES dbo.Vehicles(id) ON DELETE SET NULL,
    CONSTRAINT CK_Enquiries_name CHECK (LEN(customer_name) BETWEEN 2 AND 120),
    CONSTRAINT CK_Enquiries_email CHECK (LEN(email) BETWEEN 3 AND 320),
    CONSTRAINT CK_Enquiries_message CHECK (LEN(message) BETWEEN 5 AND 4000)
  );
  CREATE INDEX IX_Enquiries_created ON dbo.Enquiries(created_at DESC);
  CREATE INDEX IX_Enquiries_status_created ON dbo.Enquiries(status, created_at DESC);
END;
GO
