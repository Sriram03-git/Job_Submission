package com.application.tracker.job_application_tracker_api.repository;

import com.application.tracker.job_application_tracker_api.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional; // IMPORTANT: Required for findByEmailId

// JpaRepository provides all the basic CRUD methods (save, findById, findAll, delete)
@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
   
    // Custom finder method to check for existing email (required for unique validation)
    // Spring Data JPA automatically generates the query for this method name
    Optional<Application> findByEmailId(String emailId);
}
