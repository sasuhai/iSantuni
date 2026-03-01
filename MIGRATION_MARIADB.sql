-- MARIADB MIGRATION SCHEMA
-- For Hostinger Web Hosting

-- USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `email` VARCHAR(255) UNIQUE,
  `password` VARCHAR(255), -- For custom auth
  `name` VARCHAR(255),
  `role` VARCHAR(50) DEFAULT 'editor',
  `assignedLocations` JSON, -- Array of strings stored as JSON
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SUBMISSIONS TABLE (Mualaf Data)
CREATE TABLE IF NOT EXISTS `submissions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `noStaf` VARCHAR(100),
  `negeriCawangan` VARCHAR(100),
  `kategori` VARCHAR(100),
  `namaAsal` VARCHAR(255),
  `namaIslam` VARCHAR(255),
  `noKP` VARCHAR(50),
  `jantina` VARCHAR(20),
  `bangsa` VARCHAR(50),
  `agamaAsal` VARCHAR(50),
  `umur` DECIMAL(5,2),
  `tarikhLahir` DATE,
  `warganegara` VARCHAR(100),
  `tarikhPengislaman` DATE,
  `masaPengislaman` VARCHAR(50),
  `tempatPengislaman` VARCHAR(255),
  `negeriPengislaman` VARCHAR(100),
  `namaPegawaiMengislamkan` VARCHAR(255),
  `noKPPegawaiMengislamkan` VARCHAR(50),
  `noTelPegawaiMengislamkan` VARCHAR(50),
  `namaSaksi1` VARCHAR(255),
  `noKPSaksi1` VARCHAR(50),
  `noTelSaksi1` VARCHAR(50),
  `namaSaksi2` VARCHAR(255),
  `noKPSaksi2` VARCHAR(50),
  `noTelSaksi2` VARCHAR(50),
  `noTelefon` VARCHAR(50),
  `alamatTinggal` TEXT,
  `poskod` VARCHAR(20),
  `bandar` VARCHAR(100),
  `negeri` VARCHAR(100),
  `alamatTetap` TEXT,
  `maklumatKenalanPengiring` TEXT,
  `pekerjaan` VARCHAR(255),
  `pendapatanBulanan` DECIMAL(15,2),
  `tanggungan` INT,
  `tahapPendidikan` VARCHAR(100),
  `lokasi` VARCHAR(255),
  `namaPenuh` VARCHAR(255),
  `registeredByName` VARCHAR(255),
  `bank` VARCHAR(100),
  `noAkaun` VARCHAR(50),
  `namaDiBank` VARCHAR(255),
  `kategoriElaun` VARCHAR(100),
  `status` VARCHAR(50) DEFAULT 'active',
  `catatan` TEXT,
  `catatanAudit` TEXT,
  `pengislamanKPI` JSON,
  `gambarIC` JSON,
  `gambarKadIslam` JSON,
  `gambarSijilPengislaman` JSON,
  `gambarMualaf` JSON,
  `gambarSesiPengislaman` JSON,
  `dokumenLain1` JSON,
  `dokumenLain2` JSON,
  `dokumenLain3` JSON,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `createdBy` VARCHAR(36),
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy` VARCHAR(36),
  `deletedAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PROGRAMS TABLE
CREATE TABLE IF NOT EXISTS `programs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `nama_program` VARCHAR(255),
  `status_program` VARCHAR(50),
  `negeri` VARCHAR(100),
  `tahun` INT,
  `bulan` INT,
  `tarikh_mula` DATE,
  `tarikh_tamat` DATE,
  `masa_mula` TIME,
  `masa_tamat` TIME,
  `tempat` VARCHAR(255),
  `kawasan_cawangan` JSON,
  `jenis_program` JSON,
  `kategori_utama` VARCHAR(100),
  `sub_kategori` JSON,
  `kehadiran_rh` INT DEFAULT 0,
  `kehadiran_daie` INT DEFAULT 0,
  `kehadiran_non_muslim` INT DEFAULT 0,
  `kehadiran_quality` INT DEFAULT 0,
  `kehadiran_madu` INT DEFAULT 0,
  `kehadiran_syahadah` INT DEFAULT 0,
  `kehadiran_muallaf` INT DEFAULT 0,
  `kehadiran_keseluruhan` INT DEFAULT 0,
  `anjuran` JSON,
  `kawasan_ikram` VARCHAR(255),
  `link_facebook` VARCHAR(255),
  `catatan_1` TEXT,
  `catatan_2` TEXT,
  `selesai_laporan` BOOLEAN DEFAULT FALSE,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CLASSES TABLE
CREATE TABLE IF NOT EXISTS `classes` (
  `id` VARCHAR(36) PRIMARY KEY,
  `lokasi` VARCHAR(100),
  `negeri` VARCHAR(100),
  `namaKelas` VARCHAR(255),
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- WORKERS TABLE
CREATE TABLE IF NOT EXISTS `workers` (
  `id` VARCHAR(36) PRIMARY KEY,
  `nama` VARCHAR(255),
  `peranan` VARCHAR(100),
  `lokasi` VARCHAR(100),
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS `attendance_records` (
  `id` VARCHAR(100) PRIMARY KEY,
  `classId` VARCHAR(100),
  `year` VARCHAR(4),
  `month` VARCHAR(2),
  `students` JSON,
  `workers` JSON,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- RATE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS `rateCategories` (
  `id` VARCHAR(36) PRIMARY KEY,
  `kategori` VARCHAR(255),
  `jenis` VARCHAR(50),
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `createdBy` VARCHAR(36),
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy` VARCHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- KPI SETTINGS TABLE
CREATE TABLE IF NOT EXISTS `kpi_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kpi_name` VARCHAR(255),
  `category` VARCHAR(100),
  `target` DECIMAL(15,2),
  `year` INT,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- LOOKUP TABLES
CREATE TABLE IF NOT EXISTS `states` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) UNIQUE,
  `IDMualaf` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `program_status` (`id` INT AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(100) UNIQUE);
CREATE TABLE IF NOT EXISTS `program_categories` (`id` INT AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(100) UNIQUE);
CREATE TABLE IF NOT EXISTS `program_organizers` (`id` INT AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(100) UNIQUE);
CREATE TABLE IF NOT EXISTS `program_types` (`id` INT AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(100) UNIQUE);
CREATE TABLE IF NOT EXISTS `locations` (`id` INT AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(100) UNIQUE);

-- SEED DATA
INSERT IGNORE INTO `program_status` (`name`) VALUES ('Akan Datang'), ('Selesai'), ('Batal'), ('Tangguh');
INSERT IGNORE INTO `program_categories` (`name`) VALUES ('Outreach'), ('Kelas'), ('Kebajikan'), ('Lain-lain');
INSERT IGNORE INTO `states` (`name`, `IDMualaf`) VALUES 
('Johor', 'JHR'), ('Kedah', 'KDH'), ('Kelantan', 'KTN'), ('Melaka', 'MLK'), 
('Negeri Sembilan', 'NSN'), ('Pahang', 'PHG'), ('Perak', 'PRK'), ('Perlis', 'PLS'), 
('Pulau Pinang', 'PNG'), ('Sabah', 'SBH'), ('Sarawak', 'SWK'), ('Selangor', 'SGR'), 
('Terengganu', 'TRG'), ('W.P. Kuala Lumpur', 'KUL'), ('W.P. Labuan', 'LBN'), ('W.P. Putrajaya', 'PJY');
