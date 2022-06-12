package org.example.telegramservice.dbservice.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;

import javax.persistence.*;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "user", schema = "users")
public class User {

    @Id
    @Column(name = "chatId", unique = true)
    String chatId;
    String fName;
    String lName;
    String userNickName;
    String languageCode;
    boolean oracleSelected;
    int currProblem;
}