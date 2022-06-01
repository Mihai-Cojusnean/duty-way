package org.example.telegramservice.dbservice.repository;

import org.example.telegramservice.dbservice.game.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MatchRepo extends JpaRepository<Match, String> {

    Match findByChatId(String chatId);
}