package org.example.telegramservice.commands;

import org.example.telegramservice.service.BtnManager;
import org.example.telegramservice.service.UserService;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;

@Component
public class StartCommand implements CommandGenerator<SendMessage> {

    private final UserService userService;

    public StartCommand(UserService userService) {
        this.userService = userService;
    }

    @Override
    public SendMessage generate(Update update) {
        String chatId = update.getMessage().getChatId().toString();
        BtnManager buttons = new BtnManager();
        userService.getUser(update, chatId);
        SendMessage sendMessage = new SendMessage(update.getMessage().getChatId().toString(), "hello");
        sendMessage.setReplyMarkup(buttons.setStickyBtn(new String[]{"Start game", "Near table", "Oracle prob"}));
        return sendMessage;
    }

    @Override
    public String[] getInputCommand() {
        return new String[]{"/start", "menu"};
    }
}