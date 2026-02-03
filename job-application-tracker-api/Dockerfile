# Stage 1: Build the application using Maven and JDK 21
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom.xml and download dependencies to leverage Docker cache
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the rest of the source code
COPY src ./src

# Package the application, skipping tests
RUN mvn package -DskipTests

# Stage 2: Create the final, smaller image using JRE 21
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
# Copy the JAR file from the build stage
COPY --from=build /app/target/*.jar app.jar
# Expose the port the app runs on (default for Spring Boot is 8080)
EXPOSE 8080
# Set the entrypoint to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]