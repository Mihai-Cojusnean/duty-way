package org.example.telegramservice.commands;

import org.example.telegramservice.dbservice.game.Match;
import org.example.telegramservice.service.BtnManager;
import org.example.telegramservice.service.UserService;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;

@Component
public class StartGameCommand implements CommandGenerator<SendMessage> {

    private final UserService userService;

    public StartGameCommand(UserService userService) {
        this.userService = userService;
    }

    @Override
    public SendMessage generate(Update update) {
        BtnManager buttons = new BtnManager();
        Match match = userService.getOpponent(update);
        String format = "%s|%s|%s|%s\n%s|%s|%s|%s";
        SendMessage sendMessage = new SendMessage(update.getMessage().getChatId().toString(), String.format(format,
                "1. " + update.getMessage().getFrom().getFirstName(), match.getMyPts(), match.getMyScore(), "\uD83C\uDFD3",
                "2. " + match.getOpponentName(), match.getOpponentPts(), match.getOpponentScore(), ""));
        sendMessage.setReplyMarkup(buttons.setInlineKeyboardMarkup(new String[][]{{"1.+", "2.+", "↔", "new game"}}));
        return sendMessage;
    }

    @Override
    public String[] getInputCommand() {
        return new String[]{"Start game"};
    }
}