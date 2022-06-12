package org.example.telegramservice.commands;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import lombok.NonNull;
import lombok.SneakyThrows;
import org.example.telegramservice.service.MessageService;
import org.example.telegramservice.service.yamlConfig.ApplicationConfig;
import org.example.telegramservice.service.yamlConfig.LocationsConfig;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendLocation;
import org.telegram.telegrambots.meta.api.objects.Update;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;

@Component
public class FindNearTableCommand implements CommandGenerator<SendLocation> {

    HashMap<String, Object> locationInfo = new HashMap<>();

    @SneakyThrows
    @Override
    public SendLocation generate(Update update) {
        @NonNull Double userLatitude = update.getMessage().getLocation().getLatitude();
        Double userLongitude = update.getMessage().getLocation().getLongitude();
        SendLocation sendLocation = new SendLocation();
        MessageService message = new MessageService();
        ApplicationConfig config = getConfig();

        getClosestLocation(config, userLatitude, userLongitude);
        message.sendMessage((int) locationInfo.get("tables"), (String) locationInfo.get("location name"), update);
        sendLocation.setChatId(update.getMessage().getChatId().toString());
        sendLocation.setLatitude((Double) locationInfo.get("latitude"));
        sendLocation.setLongitude((Double) locationInfo.get("longitude"));

        return sendLocation;
    }

    private ApplicationConfig getConfig() throws IOException {
        File file = new File("src/main/resources/tables_locations.yaml");
        ObjectMapper objectMapper = new ObjectMapper(new YAMLFactory());
        return objectMapper.readValue(file, ApplicationConfig.class);
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