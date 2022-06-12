package org.example.telegramservice.service;

import org.example.telegramservice.dbservice.entity.User;
import org.example.telegramservice.dbservice.game.Match;
import org.example.telegramservice.dbservice.repository.MatchRepo;
import org.example.telegramservice.dbservice.repository.UserRepo;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.api.objects.Update;

import static java.util.Objects.isNull;

@Service
public class UserService {

    private final UserRepo userRepo;
    private final MatchRepo matchRepo;


    public UserService(UserRepo userRepo, MatchRepo matchRepo) {
        this.userRepo = userRepo;
        this.matchRepo = matchRepo;
    }

    /* user database */
    public User getUser(Update update, String chatId) {
        User user = userRepo.findByChatId(chatId);

        if (isNull(user)) user = saveUser(update);
        return user;
    }

    public User saveUser(Update update) {
        return userRepo.save(new User(
                update.getMessage().getChatId().toString(),
                update.getMessage().getChat().getFirstName(),
                update.getMessage().getChat().getLastName(),
                update.getMessage().getFrom().getUserName(),
                update.getMessage().getFrom().getLanguageCode(),
                true,
                1
        ));
    }

//    public User


    /* match database */
    public Match getOpponent(Update update) {
        Match match = matchRepo.findByChatId(
                isNull(update.getMessage()) ?
                        update.getCallbackQuery().getFrom().getId().toString() : update.getMessage().getChatId().toString());
        if (isNull(match)) match = saveOpponent(update);
        return match;
    }

    private Match saveOpponent(Update update) {
        return matchRepo.save(new Match(
                update.getMessage().getChatId().toString(),
                "Opponent",
                0,
                0,
                0,
                0
        ));
    }
}