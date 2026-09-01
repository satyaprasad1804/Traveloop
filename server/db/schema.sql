-- =============================================================
--  Traveloop — MySQL Database Schema
--  Project : Odoo KAHE Hackathon | Team The Invictus
--  Created : 2026-05-10
-- =============================================================

CREATE DATABASE IF NOT EXISTS odoo_hackathon;
USE odoo_hackathon;

SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------
-- 1. USERS
--    Core authentication table. Passwords stored as bcrypt hash.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    name          VARCHAR(120)      NOT NULL,
    email         VARCHAR(255)      NOT NULL,
    password_hash VARCHAR(255)      NOT NULL,                -- bcrypt / argon2 hash
    avatar_url    VARCHAR(512)          NULL DEFAULT NULL,
    created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP
                                              ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 2. TRIPS
--    Master record for a multi-city itinerary.
--    sharing_status: 'private' | 'shared' | 'public'
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
    id             INT UNSIGNED        NOT NULL AUTO_INCREMENT,
    user_id        INT UNSIGNED        NOT NULL,             -- trip owner
    title          VARCHAR(200)        NOT NULL,
    description    TEXT                    NULL DEFAULT NULL,
    start_date     DATE                    NULL DEFAULT NULL,
    end_date       DATE                    NULL DEFAULT NULL,
    total_budget   DECIMAL(10,2)       NOT NULL DEFAULT 0.00,
    currency       CHAR(3)             NOT NULL DEFAULT 'USD', -- ISO-4217
    sharing_status ENUM('private','shared','public')
                                       NOT NULL DEFAULT 'private',
    cover_image_url VARCHAR(512)           NULL DEFAULT NULL,
    created_at     DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_trips_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    KEY idx_trips_user_id (user_id),
    KEY idx_trips_sharing  (sharing_status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 3. TRIP COLLABORATORS  (optional — supports "shared" trips)
--    role: 'viewer' | 'editor'
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trip_collaborators (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    trip_id    INT UNSIGNED NOT NULL,
    user_id    INT UNSIGNED NOT NULL,
    role       ENUM('viewer','editor') NOT NULL DEFAULT 'viewer',
    invited_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_trip_collaborator (trip_id, user_id),

    CONSTRAINT fk_collaborators_trip
        FOREIGN KEY (trip_id) REFERENCES trips (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_collaborators_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 4. STOPS  (Cities / Destinations)
--    Each stop belongs to one trip.
--    order_index drives the drag-and-drop reorder on the client.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stops (
    id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    trip_id        INT UNSIGNED   NOT NULL,
    city_name      VARCHAR(150)   NOT NULL,
    country_code   CHAR(2)            NULL DEFAULT NULL, -- ISO-3166-1 alpha-2
    latitude       DECIMAL(9,6)       NULL DEFAULT NULL,
    longitude      DECIMAL(9,6)       NULL DEFAULT NULL,
    arrival_date   DATE               NULL DEFAULT NULL,
    departure_date DATE               NULL DEFAULT NULL,
    order_index    SMALLINT UNSIGNED NOT NULL DEFAULT 0,  -- ascending sort order
    notes          TEXT               NULL DEFAULT NULL,
    created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_stops_trip
        FOREIGN KEY (trip_id) REFERENCES trips (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    KEY idx_stops_trip_order (trip_id, order_index)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 5. ACTIVITIES
--    Linked to a specific stop (city).
--    category examples: 'sightseeing','food','transport','accommodation','other'
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    stop_id      INT UNSIGNED   NOT NULL,
    title        VARCHAR(200)   NOT NULL,
    description  TEXT               NULL DEFAULT NULL,
    category     ENUM(
                   'sightseeing',
                   'food',
                   'transport',
                   'accommodation',
                   'adventure',
                   'shopping',
                   'other'
                 )              NOT NULL DEFAULT 'other',
    cost         DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    start_time   DATETIME           NULL DEFAULT NULL,  -- specific date+time slot
    end_time     DATETIME           NULL DEFAULT NULL,
    location_name VARCHAR(200)      NULL DEFAULT NULL,
    booking_ref  VARCHAR(100)       NULL DEFAULT NULL,  -- confirmation / booking ID
    is_booked    TINYINT(1)     NOT NULL DEFAULT 0,
    created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                         ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_activities_stop
        FOREIGN KEY (stop_id) REFERENCES stops (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    KEY idx_activities_stop    (stop_id),
    KEY idx_activities_category(category)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 6. PACKING CHECKLIST
--    Per-trip item list. category keeps items grouped in the UI.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS packing_checklist (
    id         INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    trip_id    INT UNSIGNED   NOT NULL,
    item_name  VARCHAR(150)   NOT NULL,
    category   VARCHAR(80)        NULL DEFAULT 'General',  -- e.g. Clothes, Docs, Toiletries
    quantity   SMALLINT UNSIGNED  NOT NULL DEFAULT 1,
    is_packed  TINYINT(1)     NOT NULL DEFAULT 0,          -- 0 = unpacked, 1 = packed
    created_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_checklist_trip
        FOREIGN KEY (trip_id) REFERENCES trips (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    KEY idx_checklist_trip (trip_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- =============================================================
SET FOREIGN_KEY_CHECKS = 1;
-- =============================================================
