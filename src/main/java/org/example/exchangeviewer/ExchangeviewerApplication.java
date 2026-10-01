package org.example.exchangeviewer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class ExchangeviewerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ExchangeviewerApplication.class, args);
    }

}
