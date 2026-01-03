package com.application.tracker.job_application_tracker_api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Candidate Information
    @NotBlank(message = "Candidate name is required.")
    @Column(name = "candidate_name", nullable = false)
    private String name;

    @NotBlank(message = "Email ID is required.")
    @Email(message = "Email must be a valid format.")
    @Column(name = "email_id", nullable = false, unique = true)
    private String emailId;

    @NotBlank(message = "Mobile number is required.")
    @Pattern(regexp = "^\\d{10}$", message = "Mobile number must be 10 digits.")
    @Column(name = "mobile_number", nullable = false)
    private String mobileNumber;

    @NotBlank(message = "Experience range is required.")
    @Column(name = "experience_range", nullable = false)
    private String experienceRange;

    @Column(name = "resume_filename")
    private String resumeFilename;

    // Job Role / Details
    @NotBlank(message = "Job role is required.")
    @Column(name = "job_role", nullable = false)
    private String jobRole;

    @Column(name = "job_link")
    private String jobLink;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "status", nullable = false)
    private String status = "Applied";

    @Column(name = "application_timestamp", nullable = false)
    private LocalDateTime applicationTimestamp = LocalDateTime.now();

    // JPA requires a no-arg constructor
    public Application() {
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmailId() {
        return emailId;
    }

    public void setEmailId(String emailId) {
        this.emailId = emailId;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public String getExperienceRange() {
        return experienceRange;
    }

    public void setExperienceRange(String experienceRange) {
        this.experienceRange = experienceRange;
    }

    public String getResumeFilename() {
        return resumeFilename;
    }

    public void setResumeFilename(String resumeFilename) {
        this.resumeFilename = resumeFilename;
    }

    public String getJobRole() {
        return jobRole;
    }

    public void setJobRole(String jobRole) {
        this.jobRole = jobRole;
    }

    public String getJobLink() {
        return jobLink;
    }

    public void setJobLink(String jobLink) {
        this.jobLink = jobLink;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getApplicationTimestamp() {
        return applicationTimestamp;
    }

    public void setApplicationTimestamp(LocalDateTime applicationTimestamp) {
        this.applicationTimestamp = applicationTimestamp;
    }
}
