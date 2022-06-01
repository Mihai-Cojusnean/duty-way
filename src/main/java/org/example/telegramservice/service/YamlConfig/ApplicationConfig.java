package org.example.telegramservice.service.YamlConfig;

import java.util.List;

public class ApplicationConfig {

    // Without a default constructor, Jackson will throw an exception
    public ApplicationConfig() {}

    public ApplicationConfig(String city, List<LocationsConfig> locations) {
        this.city = city;
        this.locations = locations;
    }
    private String city;
    private List<LocationsConfig> locations;

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public List<LocationsConfig> getLocations() {
        return locations;
    }

    public void setLocations(List<LocationsConfig> locations) {
        this.locations = locations;
    }

    @Override
    public String toString() {
        return "\nCity: " + city + "\nlocations: " + locations + "\n";
    }
}
