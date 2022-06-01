package org.example.telegramservice.commands;

import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;

@Component
public class FindNearPlayer implements CommandGenerator<SendMessage> {

    @Override
    public SendMessage generate(Update update) {
//        User user
        return null;
    }

    @Override
    public String[] getInputCommand() {
        return new String[]{"Find opponent"};
    }
}
