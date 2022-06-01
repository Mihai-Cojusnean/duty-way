package org.example.telegramservice.botconfiguration;

import lombok.SneakyThrows;
import org.example.telegramservice.commands.CommandGenerator;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendLocation;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.methods.send.SendPhoto;
import org.telegram.telegrambots.meta.api.methods.updatingmessages.EditMessageText;
import org.telegram.telegrambots.meta.api.objects.Update;

import java.util.HashMap;
import java.util.Map;

@Component
public class Bot extends TelegramLongPollingBot {
    private final Map<String, CommandGenerator<?>> commands = new HashMap<>();

    public void register(String[] presentCommands, CommandGenerator<?> generator) {
        for (String command : presentCommands) commands.put(command, generator);
    }

    @Override
    @SneakyThrows
    public void onUpdateReceived(Update update) {
        String command =
                update.hasMessage() ? update.getMessage().getText() :
                        update.hasCallbackQuery() ? update.getCallbackQuery().getData() :
                                update.getMessage().getLocation() != null ? "send near table" : "un_supported_command";

        var message = commands.computeIfAbsent(command, k -> commands.get("un_supported_command")).generate(update);

        switch (message.getClass().getSimpleName()) {
            case "SendPhoto" -> execute((SendPhoto) message);
            case "SendMessage" -> execute((SendMessage) message);
            case "SendLocation" -> execute((SendLocation) message);
            case "EditMessageText" -> execute((EditMessageText) message);
            default -> execute((SendMessage) commands.get("404 - big brain engineer is working on this problem"));
        }
    }

    @Override
    public String getBotUsername() {
        return "CojusneanBot";
    }

    @Override
    public String getBotToken() {
        return "1521467599:AAHz2D27gfj2z2M9vJmrZqm3u8U9uQuYh8I";
    }
}
