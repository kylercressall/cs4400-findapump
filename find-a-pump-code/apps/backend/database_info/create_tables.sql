CREATE TABLE User {
    user_id varchar(36) IS NOT NULL PRIMARY KEY; -- uuid
    username varchar(40); -- name of user
    -- more info will go here with password hashing etc
}

CREATE TABLE FuelType {
    fuel_type_id varchar(36) IS NOT NULL PRIMARY KEY;
    name varchar(30);
}

CREATE TABLE UserConfig {
    config_id varchar(36) IS NOT NULL PRIMARY KEY;
    user_id varchar(36) FOREIGN KEY REFERENCES User(user_id);
    fuel_preference_id varchar(36) REFERENCES FuelType(fuel_type_id);
}

CREATE TABLE Station {
    station_id varchar(36) IS NOT NULL PRIMARY KEY;
    location_id varchar(36) FOREIGN KEY REFERENCES Location(location_id);
    station_brand_id varchar(36) FOREIGN KEY REFERENCES StationBrand(brand_id);
}

CREATE TABLE StationBrand {
    station_brand_id varchar(36) IS NOT NULL PRIMARY KEY;
    brand_name varchar(50);
    logo_url varchar(150);
}

CREATE TABLE Location {
    location_id varchar(36) IS NOT NULL PRIMARY KEY;
    google_maps_url varchar(150);
    street varchar(30);
    city varchar(30);
    zip varchar(30);
    country varchar(30);
    lat real;
    long real;
}

CREATE TABLE FuelPrice {
    fuel_price_id varchar(36) IS NOT NULL PRIMARY KEY;
    station_id varchar(36) FOREIGN KEY REFERENCES Station(station_id);
    fuel_type_id varchar(36) FOREIGN KEY REFERENCES FuelType(fuel_type_id);
    fuel_unit varchar(20); -- ex. gallon/kwh
    fuel_price real;
    created_at datetime IS NOT NULL;
}

