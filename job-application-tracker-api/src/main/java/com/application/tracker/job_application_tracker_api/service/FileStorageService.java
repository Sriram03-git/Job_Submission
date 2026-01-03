package com.application.tracker.job_application_tracker_api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    // Reads the path from application.properties (e.g., file.upload-dir=uploads)
    public FileStorageService(@Value("${file.upload-dir}") String uploadDir) {
        // Resolve the path and normalize it to ensure proper OS path separators
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
       
        try {
            // Creates the directory if it does not exist
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            // Throw a clear error if directory creation fails (e.g., permissions issue)
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored: " + this.fileStorageLocation, ex);
        }
    }

    public String storeFile(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
       
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
       
        // Generate a cryptographically strong unique filename to prevent overwrites and access issues
        String fileName = UUID.randomUUID().toString() + fileExtension;

        try {
            // Resolve the target path safely
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            // Copy file to the target location, replacing existing file if it somehow exists
            Files.copy(file.getInputStream(), targetLocation, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            return fileName; // Returns the unique filename for database storage
        } catch (IOException ex) {
            // Log a detailed error message
            System.err.println("Error storing file: " + originalFilename + " to " + this.fileStorageLocation.resolve(fileName) + ". Reason: " + ex.getMessage());
            throw new RuntimeException("Could not store file " + originalFilename + ". Please try again!", ex);
        }
    }
   
    // Helper method to resolve the full Path of a file
    public Path getFileLocation(String filename) {
        // Resolve the path and normalize it securely
        return this.fileStorageLocation.resolve(filename).normalize();
    }
}