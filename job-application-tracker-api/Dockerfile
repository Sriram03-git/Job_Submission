# ----------- Stage 1: Build -----------
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# ----------- Stage 2: Run -----------
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=build /app/target/job-application-tracker-api-0.0.1-SNAPSHOT.jar app.jar
# Create uploads directory for persistent file storage
RUN mkdir -p /app/uploads
VOLUME /app/uploads
# Expose port (default Spring Boot port)
EXPOSE 8080
# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
