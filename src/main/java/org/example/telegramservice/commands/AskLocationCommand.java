package org.example.telegramservice.commands;

import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;

@Component
public class AskLocationCommand implements CommandGenerator<SendMessage> {
    @Override
    public SendMessage generate(Update update) {
        return new SendMessage(update.getMessage().getChatId().toString(), "Send your location");
    }

    @Override
    public String[] getInputCommand() {
        return new String[]{"Near table"};
    }
}
