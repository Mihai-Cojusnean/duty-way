package org.example.telegramservice.service.YamlConfig;

public class LocationsConfig {
    private String location;
    private String latitude;
    private String longitude;
    private int tables;

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getLatitude() {
        return latitude;
    }

    public void setLatitude(String latitude) {
        this.latitude = latitude;
    }

    public String getLongitude() {
        return longitude;
    }

    public void setLongitude(String longitude) {
        this.longitude = longitude;
    }

    public int getTables() {
        return tables;
    }

    public void setTables(int tables) {
        this.tables = tables;
    }

    @Override
    public String toString() {
        return "\nLocation: " + location + "\nlatitude: "
                + latitude + "\nlongitude: " + longitude
                + "\ntables: " + tables;
    }
}
