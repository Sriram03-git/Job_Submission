/*
 * Created in response to user request for explicit permission for static assets.
 * Location: src/main/java/com/application/tracker/job_application_tracker_api/config/SecurityConfig.java
 */
package com.application.tracker.job_application_tracker_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(requests -> requests
                // Allow HTML pages and main entry points
                .requestMatchers("/", "/index.html", "/seeker.html", "/recruiter.html").permitAll()
                // Allow static CSS and JS resources
                .requestMatchers("/*.css", "/*.js").permitAll()
                // Explicitly allow Lottie animation assets
                .requestMatchers("/lottie-player.js", "/offline_dgaccel.json").permitAll()
                // Allow all API endpoints for this application
                .requestMatchers("/api/applications/**").permitAll()
                // Authenticate anything else
                .anyRequest().authenticated()
            )
            .csrf(csrf -> csrf.disable()); // Disabling CSRF for simplicity in this demo application

        return http.build();
    }
}