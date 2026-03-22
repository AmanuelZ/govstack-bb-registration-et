Feature: Business Registration — Private Limited Company
  As a citizen or business representative
  I want to register a new Private Limited Company
  So that I can legally operate a business in Ethiopia

  Background:
    Given the Registration Building Block is running
    And the Information-Mediator-Client header is "ET/GOV/10000001/REGISTRATION"
    And I am authenticated as an applicant

  # ── Service Discovery ──────────────────────────────────────────────────

  Scenario: Discover the business registration service
    When I request GET /api/v1/services
    Then the response status is 200
    And the response contains a service with code "business-registration"
    And the service has an estimated processing time of 5 days

  Scenario: Retrieve the business registration eForm
    When I request GET /api/v1/services/business-registration/eform
    Then the response status is 200
    And the form includes a required field "entity_type"
    And the form includes a required field "company_name"
    And the form includes a required field "capital"
    And the form includes a required field "shareholders"

  # ── Application Submission ─────────────────────────────────────────────

  Scenario: Successfully submit a PLC application with valid data
    Given I have a complete PLC application with:
      | entity_type | PLC                         |
      | company_name | Addis Tech Solutions PLC   |
      | capital      | 50000                       |
      | shareholders | 60%/40% split (2 persons)  |
    When I submit the application
    Then the response status is 201
    And the application status is "DRAFT"
    And the response includes a reference number matching "REG-\d{4}-\d{6}"
    And the response includes calculated fees

  Scenario: Application is rejected when PLC capital is below minimum
    Given I have a PLC application with capital of 10000 ETB
    When I submit the application
    Then the response status is 422
    And the error code is "BB-REG-4022"
    And the error details include a violation mentioning "15000" or "capital"

  Scenario: Application is rejected when SC has fewer than 5 shareholders
    Given I have a Share Company application with 3 shareholders
    When I submit the application
    Then the response status is 422
    And the error code is "BB-REG-4022"

  Scenario: Application is rejected when shareholder percentages do not sum to 100%
    Given I have a PLC application where shareholders hold 60% and 30%
    When I submit the application
    Then the response status is 422
    And the error code is "BB-REG-4022"
    And the error message mentions "percentage" or "100"

  Scenario: Foreign shareholder triggers additional document requirement
    Given I have a PLC application with has_foreign_shareholders set to true
    When I submit the application
    Then the response status is 201
    And the calculated requirements include document "foreign_investment_permit"

  Scenario: High-capital PLC triggers surcharge fee
    Given I have a PLC application with capital of 2000000 ETB
    When I submit the application
    Then the response status is 201
    And the additional fees are greater than 0

  # ── Information Mediator ───────────────────────────────────────────────

  Scenario: Request without IM header is rejected
    Given I do not include the Information-Mediator-Client header
    When I request GET /api/v1/services
    Then the response status is 400
    And the error code is "BB-REG-4202"

  Scenario: Request with malformed IM header is rejected
    Given the Information-Mediator-Client header is "INVALID-FORMAT"
    When I request GET /api/v1/services
    Then the response status is 400
    And the error code is "BB-REG-4202"

  # ── Application Lifecycle ──────────────────────────────────────────────

  Scenario: Applicant submits a DRAFT application
    Given I have a DRAFT application with reference "REG-2024-000001"
    When I POST /api/v1/applications/{id}/submit
    Then the response status is 200
    And the application status becomes "SUBMITTED"

  Scenario: Back-office operator approves the name review task
    Given there is a SUBMITTED application
    And I am authenticated as a "name-reviewer" operator
    When I complete the name-review task with decision "APPROVED"
    Then the response status is 200
    And the application status is "UNDER_REVIEW"
    And a new task is created for the "document-verifier" role

  Scenario: Back-office operator sends application back to applicant
    Given there is a SUBMITTED application
    And I am authenticated as a "name-reviewer" operator
    When I complete the name-review task with decision "SENT_BACK" and notes "Please notarise MoA"
    Then the response status is 200
    And the application status becomes "RETURNED"

  Scenario: Applicant cannot access another applicant's application
    Given application "REG-2024-000099" belongs to a different applicant
    When I request GET /api/v1/applications/{id}
    Then the response status is 403
    And the error code is "BB-REG-4003"

  # ── Audit Trail ───────────────────────────────────────────────────────

  Scenario: All status transitions are recorded in the audit trail
    Given a complete application lifecycle has occurred
    When the application reaches "APPROVED" status
    Then the status history contains entries for:
      | DRAFT       |
      | SUBMITTED   |
      | UNDER_REVIEW |
      | APPROVED    |
    And each history entry has a timestamp and actor ID

  # ── Health & Readiness ────────────────────────────────────────────────

  Scenario: Health endpoint returns 200 without authentication
    When I request GET /api/v1/health without authentication
    Then the response status is 200
    And the response contains "status": "ok"

  Scenario: Readiness endpoint checks database and Redis
    When I request GET /api/v1/ready without authentication
    Then the response status is 200
    And the response contains database check "ok"
    And the response contains redis check "ok"
