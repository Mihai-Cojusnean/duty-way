package org.example.telegramservice.commands;

import org.example.telegramservice.botconfiguration.Bot;
import org.springframework.beans.factory.annotation.Autowired;
import org.telegram.telegrambots.meta.api.objects.Update;

public interface CommandGenerator<T> {

    T generate(Update update);

    String[] getInputCommand();

    @Autowired
    default void registerMySelf(Bot bot) {
        bot.register(getInputCommand(), this);
    }
}
