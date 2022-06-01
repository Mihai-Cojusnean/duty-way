package org.example.telegramservice.commands;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import lombok.NonNull;
import org.example.telegramservice.service.MessageService;
import org.example.telegramservice.service.YamlConfig.ApplicationConfig;
import org.example.telegramservice.service.YamlConfig.LocationsConfig;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendLocation;
import org.telegram.telegrambots.meta.api.objects.Update;

import java.io.File;
import java.util.HashMap;

@Component
public class FindNearTableCommand implements CommandGenerator<SendLocation> {

    HashMap<String, Object> locationInfo = new HashMap<>();

    @Override
    public SendLocation generate(Update update) {
        @NonNull Double userLatitude = update.getMessage().getLocation().getLatitude();
        Double userLongitude = update.getMessage().getLocation().getLongitude();
        File file = new File("src/main/resources/tables_locations.yaml");
        ObjectMapper objectMapper = new ObjectMapper(new YAMLFactory());

        try {
            ApplicationConfig config = objectMapper.readValue(file, ApplicationConfig.class);
            getClosestLocation(config, userLatitude, userLongitude);
            MessageService message = new MessageService();
            message.sendMessage((int) locationInfo.get("tables"), (String) locationInfo.get("location name"), update);
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
        SendLocation sendLocation = new SendLocation();
        sendLocation.setChatId(update.getMessage().getChatId().toString());
        sendLocation.setLatitude((Double) locationInfo.get("latitude"));
        sendLocation.setLongitude((Double) locationInfo.get("longitude"));
        return sendLocation;
    }

    @Override
    public String[] getInputCommand() {
        return new String[]{"send near table"};
    }

    public void getClosestLocation(ApplicationConfig config, @NonNull Double userLatitude, Double userLongitude) {
        double difference = Double.MAX_VALUE;
        for (int i = 0; i < config.getLocations().size(); i++) {
            LocationsConfig location = config.getLocations().get(i);
            double currDifference = Math.abs(userLatitude - Double.parseDouble(location.getLatitude()))
                    + Math.abs(userLongitude - Double.parseDouble(location.getLongitude()));
            if (currDifference < difference) {
                locationInfo.put("latitude", Double.parseDouble(location.getLatitude()));
                locationInfo.put("longitude", Double.parseDouble(location.getLongitude()));
                locationInfo.put("tables", location.getTables());
                locationInfo.put("location name", location.getLocation());
                difference = currDifference;
            }
        }
    }
}