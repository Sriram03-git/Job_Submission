package com.application.tracker.job_application_tracker_api.controller;

import com.application.tracker.job_application_tracker_api.model.Application;
import com.application.tracker.job_application_tracker_api.repository.ApplicationRepository;
import com.application.tracker.job_application_tracker_api.service.FileStorageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;


@RestController
@RequestMapping("/api/applications")
public class JobApplicationController {
    // ...existing code...

    @GetMapping("/candidate")
    public void candidatePage(HttpServletResponse response) throws IOException {
        ClassPathResource htmlFile = new ClassPathResource("static/seeker.html");
        response.setContentType("text/html");
        StreamUtils.copy(htmlFile.getInputStream(), response.getOutputStream());
    }

    @GetMapping("/hr")
    public void hrPage(HttpServletResponse response) throws IOException {
        ClassPathResource htmlFile = new ClassPathResource("static/recruiter.html");
        response.setContentType("text/html");
        StreamUtils.copy(htmlFile.getInputStream(), response.getOutputStream());
    }

    private final ApplicationRepository applicationRepository;

    private final FileStorageService fileStorageService;

    // Constructor injection is preferred over field injection.
    public JobApplicationController(ApplicationRepository applicationRepository, FileStorageService fileStorageService) {
        this.applicationRepository = applicationRepository;
        this.fileStorageService = fileStorageService;
    }

    // --- Utility to generate random 4-digit ID ---
    private Long generateUniqueId() {
        Long newId;
        do {
            newId = (long) ThreadLocalRandom.current().nextInt(1000, 10000);
        } while (applicationRepository.existsById(newId));
        return newId;
    }

    // --- Validation Error Handler ---
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
        public Map<String, String> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                FieldError::getDefaultMessage,
                (existing, replacement) -> existing
            ));
        errors.put("general", "Please correct the errors in the form before submitting.");
        return errors;
    }

    // 1. CREATE (Add a new application and handle file upload)
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<Application> createApplication(
            @Valid @RequestPart("application") Application application,
            @RequestParam("resume") MultipartFile resumeFile) {
        try {
            if (resumeFile == null || resumeFile.isEmpty() || resumeFile.getSize() == 0) {
                return ResponseEntity.badRequest().build();
            }

            Optional<Application> existingApp = applicationRepository.findByEmailId(application.getEmailId());
            if (existingApp.isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }

            String fileName = fileStorageService.storeFile(resumeFile);
            application.setResumeFilename(fileName);

            application.setId(generateUniqueId());
            Application savedApplication = applicationRepository.save(application);

            return new ResponseEntity<>(savedApplication, HttpStatus.CREATED);

        } catch (Exception e) {
            System.err.println("Error creating application: " + e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 2. READ all applications
    @GetMapping
    public ResponseEntity<List<Application>> getAllApplications() {
        try {
            List<Application> applications = applicationRepository.findAll();
            return new ResponseEntity<>(applications, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 3. READ application by ID
    @GetMapping("/{id}")
    public ResponseEntity<Application> getApplicationById(@PathVariable Long id) {
        Optional<Application> application = applicationRepository.findById(id);
        return application.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // 4. READ application by Email ID (for seeker status check)
    @GetMapping(params = "email")
    public ResponseEntity<List<Application>> getApplicationsByEmail(@RequestParam String email) {
        try {
            Optional<Application> app = applicationRepository.findByEmailId(email);
            if (app.isPresent()) {
                return new ResponseEntity<>(List.of(app.get()), HttpStatus.OK);
            } else {
                return new ResponseEntity<>(List.of(), HttpStatus.OK);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 5. UPDATE status
    @PatchMapping("/{id}/status")
    public ResponseEntity<Application> updateApplicationStatus(
            @PathVariable Long id,
            @RequestBody Application statusUpdate) {
        Optional<Application> applicationOptional = applicationRepository.findById(id);

        if (applicationOptional.isPresent()) {
            Application application = applicationOptional.get();
            application.setStatus(statusUpdate.getStatus());
            Application updatedApplication = applicationRepository.save(application);
            return new ResponseEntity<>(updatedApplication, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // 6. DELETE application
    @DeleteMapping("/{id}")
    public ResponseEntity<HttpStatus> deleteApplication(@PathVariable Long id) {
        try {
            applicationRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 7. Download Resume
    @GetMapping("/resume/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        try {
            Optional<Application> application = applicationRepository.findById(id);
            if (application.isEmpty() || application.get().getResumeFilename() == null) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            String fileName = application.get().getResumeFilename();
            Path filePath = fileStorageService.getFileLocation(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            System.err.println("Error downloading file: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 8. Statistics: total count
    @GetMapping("/statistics/total")
    public ResponseEntity<Long> getTotalApplications() {
        try {
            long count = applicationRepository.count();
            return new ResponseEntity<>(count, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 9. Statistics: by status
    @GetMapping("/statistics/byStatus")
    public ResponseEntity<Map<String, Long>> getApplicationsByStatus() {
        try {
            List<Application> applications = applicationRepository.findAll();
            Map<String, Long> countByStatus = applications.stream()
                    .collect(Collectors.groupingBy(Application::getStatus, Collectors.counting()));
            return new ResponseEntity<>(countByStatus, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
