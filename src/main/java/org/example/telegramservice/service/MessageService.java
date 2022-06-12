package org.example.telegramservice.service;

import org.example.telegramservice.botconfiguration.Bot;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

@Service
public class MessageService {
    public void sendMessage(int tables, String location_name, Update update) throws TelegramApiException {
        Bot bot = new Bot();
        SendMessage sendMessage = new SendMessage(update.getMessage().getChatId().toString(),
                "Closest table to you is at " + location_name +
                        (tables > 1 ? "\nThere are " + tables + " tables" : "\nThere is " + tables + " table"));
        bot.execute(sendMessage);
    }
}