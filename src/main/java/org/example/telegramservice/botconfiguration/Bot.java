package org.example.telegramservice.botconfiguration;

import lombok.SneakyThrows;
import org.example.telegramservice.commands.CommandGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.polls.SendPoll;
import org.telegram.telegrambots.meta.api.methods.send.SendLocation;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.methods.send.SendPhoto;
import org.telegram.telegrambots.meta.api.methods.updatingmessages.EditMessageText;
import org.telegram.telegrambots.meta.api.objects.Update;

import java.util.HashMap;
import java.util.Map;

@Component
public class Bot extends TelegramLongPollingBot {
    @Autowired
    Environment env;
    private final Map<String, CommandGenerator<?>> commands = new HashMap<>();

    public void register(String[] presentCommands, CommandGenerator<?> generator) {
        for (String command : presentCommands) commands.put(command, generator);
    }

    @Override
    @SneakyThrows
    public void onUpdateReceived(Update update) {
        if (update.hasPoll()) return;
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
            case "SendPoll" -> execute((SendPoll) message);
        }
    }

    @Override
    public String getBotUsername() {
        return "CojusneanBot";
    }

    @Override
    public String getBotToken() {
        return env.getProperty("botToken");
    }
}
