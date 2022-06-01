package org.example.telegramservice.commands;

import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;

@Component
public class UnSupportedCommand implements CommandGenerator<SendMessage> {
    @Override
    public SendMessage generate(Update update) {
        return new SendMessage(update.getMessage().getChatId().toString(), "What? Speak Bot language human. \nEducate your self, here are normal words: /start");
    }

    @Override
    public String[] getInputCommand() {
        return new String[]{"un_supported_command"};
    }
}
