package org.example.telegramservice.dbservice.game;

import lombok.*;
import lombok.experimental.FieldDefaults;

import javax.persistence.*;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "match", schema = "game")
public class Match {

    @Id
    @Column(name = "chatId", unique = true)
    String chatId;
    String opponentName;
    int myPts;
    int opponentPts;
    int myScore;
    int opponentScore;
}