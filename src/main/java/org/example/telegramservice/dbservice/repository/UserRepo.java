package org.example.telegramservice.dbservice.repository;

import org.example.telegramservice.dbservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepo extends JpaRepository<User, String> {

    User findByChatId(String chatId);
}